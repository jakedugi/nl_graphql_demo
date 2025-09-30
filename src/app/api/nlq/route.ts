import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  GraphQLQueryPlanSchema,
  UserError,
  ValidationError,
  UpstreamError,
  type GraphQLQueryPlan
} from "../../../agent/schemas";
import { compileQueryPlan, validateQuery } from "../../../graphql/compiler";
import { createUserError, createValidationError, createUpstreamError } from "../../../lib/errors";
import { withTracing } from "../../../lib/tracing";
import { env } from "../../../config/env";

// Create the prompt without template variables to avoid parsing issues
function createPrompt(userQuery: string) {
  const systemMessage = `You are an expert at converting natural language queries about football/soccer statistics into GraphQL queries.

Only respond to football/soccer related queries. For non-football queries, return: {\"error\": \"Please ask about football/soccer statistics\"}

Available GraphQL operations:

1. SIMPLE QUERIES:
- players: Get basic player info. Args: name, names, team, position. Fields: id, name, position, age, nationality, goals, assists, shots, xg, xgot, passes, tackles, appearances
- teams: Get team info. Args: name, league, country. Fields: id, name, shortName, country, founded, stadium, manager
- matches: Get match results. Args: homeTeam, awayTeam, team, season. Fields: id, homeScore, awayScore, date, utcKickoff, round
- competitions: Get competitions. Args: name, country. Fields: id, name, country, code, level
- seasons: Get seasons. Args: year. Fields: id, label, startYear, endYear

2. ADVANCED STATISTICAL QUERIES:
For queries mentioning time periods (first half, second half), time buckets (15min, 30min), seasons ranges, or grouping:
Use rootField: \"stats\" with these patterns:

Example for time-bucketed goals:
{\"operation\": \"query\", \"rootField\": \"stats\", \"fields\": [\"playerGoals\"], \"arguments\": {\"filter\": {\"players\": [\"player:haaland\", \"player:salah\"], \"competitions\": [\"comp:epl\"], \"seasons\": {\"from\": \"2022/23\", \"to\": \"2025/26\"}, \"period\": \"FIRST_HALF\"}, \"split\": {\"timeInterval\": {\"sizeMinutes\": 15}}, \"groupBy\": [\"PLAYER\", \"TIME_INTERVAL\", \"SEASON\"]}}

KEY PATTERNS:
- \"first half\" + \"time buckets\" + \"seasons\" - use stats with period: FIRST_HALF, split: timeInterval, groupBy: [PLAYER, TIME_INTERVAL, SEASON]
- \"15min buckets\" - split: {timeInterval: {sizeMinutes: 15}}
- Multiple seasons - seasons: {from: \"2022/23\", to: \"2025/26\"}
- Multiple players - players: [\"player:haaland\", \"player:salah\", \"player:de_bruyne\"]
- Premier League - competitions: [\"comp:epl\"]

Return ONLY valid JSON.`;

  return [
    { role: "system", content: systemMessage },
    { role: "human", content: `Convert this natural language query to a GraphQL query plan: ${userQuery}` }
  ];
}

// Initialize Groq model
const model = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0.1,
});

export const runtime = "edge";

export async function POST(req: NextRequest) {
  return withTracing("nlq_process", async (traceId) => {
    try {
      const { query } = await req.json();

      if (!query || typeof query !== "string") {
        return Response.json(createUserError("Query parameter is required"), { status: 400 });
      }

      console.log("Processing NL query:", query);

      // Generate query plan using AI
      const promptMessages = createPrompt(query);
      const planResult = await model.invoke(promptMessages);
      const responseText = planResult.content as string;
      console.log("Raw AI response:", responseText);

      // Parse the JSON response (may be wrapped in markdown)
      let plan: GraphQLQueryPlan;
      try {
        // Extract JSON from response (handle markdown code blocks)
        let jsonString = responseText.trim();

        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Find JSON object boundaries
        const startBrace = jsonString.indexOf('{');
        const endBrace = jsonString.lastIndexOf('}');

        if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
          jsonString = jsonString.substring(startBrace, endBrace + 1);
        }

        const parsedJson = JSON.parse(jsonString);

        // Handle error responses from AI
        if (parsedJson.error) {
          return Response.json(createUserError(parsedJson.error, true), { status: 400 });
        }

        plan = GraphQLQueryPlanSchema.parse(parsedJson);
        console.log("Parsed plan:", plan);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return Response.json(
          createUpstreamError(
            "Failed to parse query plan from AI response",
            parseError instanceof Error ? parseError.message : String(parseError)
          ),
          { status: 500 }
        );
      }

      // Compile GraphQL query
      const compiledQuery = compileQueryPlan(plan);
      console.log("Compiled query:", compiledQuery);

      // Validate GraphQL query
      const validation = validateQuery(compiledQuery);
      if (!validation.isValid) {
        return Response.json(
          createValidationError(
            "Invalid GraphQL query generated",
            validation.errors.map(err => err.message),
            plan,
            compiledQuery
          ),
          { status: 400 }
        );
      }

      // Mock execution (replace with real GraphQL endpoint)
      const mockData = executeMockQuery(plan);

      return Response.json({
        success: true,
        query,
        plan,
        compiledQuery,
        data: mockData,
      });

    } catch (error) {
      console.error("NL-GraphQL error:", error);
      return Response.json(
        createUpstreamError(
          "Failed to process natural language query",
          error instanceof Error ? error.message : String(error)
        ),
        { status: 500 }
      );
    }
  });
}

// Comprehensive mock data for football statistics
const MOCK_PLAYERS = [
  {
    id: "player:salah",
    name: "Mohamed Salah",
    team: { id: "team:liverpool", name: "Liverpool", shortName: "LIV" },
    position: "Right Winger",
    age: 31,
    nationality: "Egypt",
    goals: 18,
    assists: 9,
    shots: 87,
    xg: 16.2,
    xgot: 15.8,
    passes: 1247,
    tackles: 23,
    appearances: 22
  },
  {
    id: "player:haaland",
    name: "Erling Haaland",
    team: { id: "team:city", name: "Manchester City", shortName: "MCI" },
    position: "Centre Forward",
    age: 23,
    nationality: "Norway",
    goals: 24,
    assists: 5,
    shots: 78,
    xg: 21.4,
    xgot: 23.1,
    passes: 567,
    tackles: 8,
    appearances: 20
  },
  {
    id: "player:de_bruyne",
    name: "Kevin De Bruyne",
    team: { id: "team:city", name: "Manchester City", shortName: "MCI" },
    position: "Attacking Midfielder",
    age: 32,
    nationality: "Belgium",
    goals: 6,
    assists: 15,
    shots: 45,
    xg: 4.8,
    xgot: 5.2,
    passes: 1896,
    tackles: 34,
    appearances: 18
  }
];

const MOCK_TEAMS = [
  {
    id: "team:liverpool",
    name: "Liverpool",
    shortName: "LIV",
    league: { id: "comp:epl", name: "Premier League" },
    country: "England",
    founded: 1892,
    stadium: "Anfield",
    manager: "Arne Slot"
  },
  {
    id: "team:city",
    name: "Manchester City",
    shortName: "MCI",
    league: { id: "comp:epl", name: "Premier League" },
    country: "England",
    founded: 1880,
    stadium: "Etihad Stadium",
    manager: "Pep Guardiola"
  },
  {
    id: "team:arsenal",
    name: "Arsenal",
    shortName: "ARS",
    league: { id: "comp:epl", name: "Premier League" },
    country: "England",
    founded: 1886,
    stadium: "Emirates Stadium",
    manager: "Mikel Arteta"
  }
];

const MOCK_COMPETITIONS = [
  {
    id: "comp:epl",
    name: "Premier League",
    country: "England",
    code: "EPL",
    level: 1
  },
  {
    id: "comp:ucl",
    name: "UEFA Champions League",
    country: "Europe",
    code: "UCL",
    level: 1
  }
];

const MOCK_SEASONS = [
  { id: "season:2024-25", label: "2024/25", startYear: 2024, endYear: 2025 },
  { id: "season:2023-24", label: "2023/24", startYear: 2023, endYear: 2024 },
  { id: "season:2022-23", label: "2022/23", startYear: 2022, endYear: 2023 }
];

const MOCK_MATCHES = [
  {
    id: "match:1",
    homeTeam: { id: "team:liverpool", name: "Liverpool" },
    awayTeam: { id: "team:city", name: "Manchester City" },
    homeScore: 2,
    awayScore: 1,
    date: "2024-11-15",
    utcKickoff: "2024-11-15T17:30:00Z",
    round: "Matchday 12",
    fixtureId: "fix_12_001",
    dayOfWeek: "Sunday",
    referee: { id: "ref:oliver", name: "Michael Oliver", nationality: "England" },
    season: { id: "season:2024-25", label: "2024/25" },
    competition: { id: "comp:epl", name: "Premier League" }
  },
  {
    id: "match:2",
    homeTeam: { id: "team:arsenal", name: "Arsenal" },
    awayTeam: { id: "team:liverpool", name: "Liverpool" },
    homeScore: 1,
    awayScore: 3,
    date: "2024-11-08",
    utcKickoff: "2024-11-08T16:00:00Z",
    round: "Matchday 11",
    fixtureId: "fix_11_005",
    dayOfWeek: "Saturday",
    referee: { id: "ref:taylor", name: "Anthony Taylor", nationality: "England" },
    season: { id: "season:2024-25", label: "2024/25" },
    competition: { id: "comp:epl", name: "Premier League" }
  }
];

// Generate mock time-bucketed goal data with filter support
function generatePlayerGoalStats(playerIds: string[], filter?: any) {
  const period = filter?.period || "FULL_TIME";
  const bucketSize = filter?.split?.timeInterval?.sizeMinutes || 15;
  const seasonRange = filter?.seasons;

  // Generate time buckets based on period and bucket size
  let timeBuckets = [];
  if (period === "FIRST_HALF") {
    for (let i = 0; i < 45; i += bucketSize) {
      const end = Math.min(i + bucketSize - 1, 45);
      timeBuckets.push({
        label: `${i}-${end}`,
        startMinute: i,
        endMinute: end
      });
    }
  } else {
    // Full game buckets
    for (let i = 0; i < 90; i += bucketSize) {
      const end = Math.min(i + bucketSize - 1, 90);
      timeBuckets.push({
        label: `${i}-${end}`,
        startMinute: i,
        endMinute: end
      });
    }
  }

  const seasons = seasonRange ?
    MOCK_SEASONS.filter(s => s.label >= seasonRange.from && s.label <= seasonRange.to) :
    [MOCK_SEASONS[0]];

  const rows = [];
  const players = MOCK_PLAYERS.filter(p => playerIds.includes(p.id));

  for (const player of players) {
    for (const season of seasons) {
      for (const bucket of timeBuckets) {
        // Generate realistic goal distribution
        const isFirstHalf = bucket.endMinute <= 45;
        const baseGoals = isFirstHalf ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3);
        const playerMultiplier = player.name === "Erling Haaland" ? 1.5 :
                               player.name === "Mohamed Salah" ? 1.3 : 1.0;
        const goals = Math.floor(baseGoals * playerMultiplier);

        if (goals > 0) {
          rows.push({
            player: {
              id: player.id,
              name: player.name
            },
            season,
            competition: MOCK_COMPETITIONS[0],
            bucket,
            goals,
            assists: Math.floor(Math.random() * 2),
            shots: goals * 2 + Math.floor(Math.random() * 3),
            xg: (goals * 0.8 + Math.random() * 0.4).toFixed(2),
            match: MOCK_MATCHES[0]
          });
        }
      }
    }
  }

  return { rows, totalRows: rows.length };
}

// Mock execution for demo (replace with real GraphQL endpoint)
function executeMockQuery(plan: GraphQLQueryPlan): any {
  switch (plan.rootField) {
    case "players":
      return { players: MOCK_PLAYERS };
    case "teams":
      return { teams: MOCK_TEAMS };
    case "matches":
      return { matches: MOCK_MATCHES };
    case "competitions":
      return { competitions: MOCK_COMPETITIONS };
    case "seasons":
      return { seasons: MOCK_SEASONS };
    case "stats":
      // Handle advanced statistical queries
      const filter = plan.arguments?.filter;
      const playerIds = filter?.players || ["player:salah", "player:haaland", "player:de_bruyne"];
      const goalStats = generatePlayerGoalStats(playerIds, filter);

      return {
        stats: {
          playerGoals: goalStats
        }
      };
    default:
      return { data: "Mock response - implement real GraphQL endpoint" };
  }
}