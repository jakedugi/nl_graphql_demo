import { buildSchema, parse, validate, GraphQLError } from "graphql";
import { GraphQLQueryPlan } from "../agent/schemas";

// Embedded GraphQL schema SDL (would be codegen-generated in production)
const schemaSDL = `
enum MatchPeriod { FIRST_HALF SECOND_HALF EXTRA_TIME FULL_TIME }
enum StatType { GOALS ASSISTS SHOTS XG XGOT PASSES TACKLES SAVES }
enum SortOrder { ASC DESC }
enum GroupBy { PLAYER SEASON COMPETITION MATCH TIME_INTERVAL DAY_OF_WEEK OPPONENT }

type Query {
  players(name: String, names: [String!], team: String, position: String): [Player!]!
  teams(name: String, league: String, country: String): [Team!]!
  matches(homeTeam: String, awayTeam: String, team: String, season: String): [Match!]!
  competitions(name: String, country: String): [Competition!]!
  seasons(year: String): [Season!]!
  stats: StatsQuery!
}

type StatsQuery {
  playerGoals(
    filter: PlayerStatsFilter!
    split: StatsSplit
    groupBy: [GroupBy!]
    sort: SortInput
    limit: Int
  ): PlayerStatsResult!
}

input PlayerStatsFilter {
  players: [ID!]!
  competitions: [ID!]
  seasons: SeasonRangeInput
  period: MatchPeriod
  timeRange: TimeRangeInput
  opponents: [ID!]
}

input SeasonRangeInput {
  from: String!
  to: String!
}

input TimeRangeInput {
  minuteFrom: Int!
  minuteTo: Int!
}

input StatsSplit {
  timeInterval: TimeIntervalInput
}

input TimeIntervalInput {
  sizeMinutes: Int!
}

input SortInput {
  by: StatType!
  order: SortOrder!
}

type Player {
  id: ID!
  name: String!
  team: Team
  position: String
  age: Int
  nationality: String
  goals: Int
  assists: Int
  shots: Int
  xg: Float
  xgot: Float
  passes: Int
  tackles: Int
  appearances: Int
}

type Team {
  id: ID!
  name: String!
  shortName: String
  league: Competition
  country: String
  founded: Int
  stadium: String
  manager: String
}

type Competition {
  id: ID!
  name: String!
  country: String!
  code: String!
  level: Int
}

type Season {
  id: ID!
  label: String!
  startYear: Int!
  endYear: Int!
}

type Match {
  id: ID!
  homeTeam: Team!
  awayTeam: Team!
  homeScore: Int
  awayScore: Int
  date: String!
  utcKickoff: String
  round: String
  fixtureId: String
  dayOfWeek: String
  referee: Referee
  season: Season!
  competition: Competition!
}

type Referee {
  id: ID!
  name: String!
  nationality: String
}

type PlayerStatsResult {
  rows: [PlayerStatsRow!]!
  totalRows: Int!
}

type PlayerStatsRow {
  player: Player!
  season: Season
  competition: Competition
  bucket: TimeBucket
  goals: Int!
  assists: Int
  shots: Int
  xg: Float
  match: Match
}

type TimeBucket {
  label: String!
  startMinute: Int!
  endMinute: Int!
}
`;

const schema = buildSchema(schemaSDL);

// Helper to convert JS value to GraphQL argument syntax
function toGraphQLValue(value: any, fieldName?: string): string {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") {
    // Handle enum values (don't quote them)
    const enumFields = ["period", "groupBy", "by", "order"];
    const enumValues = [
      "FIRST_HALF", "SECOND_HALF", "EXTRA_TIME", "FULL_TIME",
      "PLAYER", "SEASON", "COMPETITION", "MATCH", "TIME_INTERVAL", "DAY_OF_WEEK", "OPPONENT",
      "GOALS", "ASSISTS", "SHOTS", "XG", "XGOT", "PASSES", "TACKLES", "SAVES",
      "ASC", "DESC"
    ];
    if ((enumFields.includes(fieldName || "") || enumValues.includes(value)) && enumValues.includes(value)) {
      return value; // No quotes for enum values
    }
    return `"${value}"`; // Quote string literals
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => toGraphQLValue(v, fieldName)).join(", ")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${toGraphQLValue(v, k)}`);
    return `{${entries.join(", ")}}`;
  }
  return String(value);
}

// Compile GraphQLQueryPlan to GraphQL string
export function compileQueryPlan(plan: GraphQLQueryPlan): string {
  const operation = plan.operation;
  const rootField = plan.rootField;

  // Handle special case for stats queries
  if (rootField === "stats") {
    // Stats field doesn't take arguments directly, playerGoals does
    const playerGoalsArgs = plan.arguments ?
      "(" + Object.entries(plan.arguments).map(([k, v]) => k + ": " + toGraphQLValue(v, k)).join(", ") + ")" : "";

    const query = `${operation} {
  ${rootField} {
    playerGoals${playerGoalsArgs} {
      rows {
        player { id name }
        season { id label }
        competition { id name }
        bucket { label startMinute endMinute }
        goals
        assists
        shots
        xg
      }
      totalRows
    }
  }
}`;
    return query;
  }

  // Handle regular queries
  const rootArgs = plan.arguments ?
    "(" + Object.entries(plan.arguments).map(([k, v]) => k + ": " + toGraphQLValue(v, k)).join(", ") + ")" : "";

  // Build field selection
  const fieldsStr = plan.fields.join("\n    ");

  const query = `${operation} {
  ${rootField}${rootArgs} {
    ${fieldsStr}
  }
}`;

  return query;
}

// Validate GraphQL query against schema
export function validateQuery(query: string): {
  isValid: boolean;
  errors: GraphQLError[];
} {
  try {
    const document = parse(query);
    const validationErrors = validate(schema, document);

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors as GraphQLError[],
    };
  } catch (parseError) {
    return {
      isValid: false,
      errors: [parseError as GraphQLError],
    };
  }
}

// Export schema for testing
export { schema };
