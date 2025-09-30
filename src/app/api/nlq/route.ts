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
import { API_CONSTANTS } from "../../../config/constants";
import { executeMockQuery } from "../../../mocks";

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

// Initialize Groq model using centralized configuration
const model = new ChatGroq(API_CONSTANTS.createGroqModel(env.GROQ_API_KEY));

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
