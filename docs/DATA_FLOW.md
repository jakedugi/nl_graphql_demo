# Data Flow: NL-GraphQL Pipeline

## E2E Request Flow

```
+-----------------+-----------------+-----------------+-----------------+
|   User Query    |   AI Planning   | Entity Resolve  | GraphQL Compile |
|  "Show Salah    |   (LangChain)   |   (Fuse.js)     |   (AST Build)   |
|   goals"        |                 |                 |                 |
+-----------------+-----------------+-----------------+-----------------+
                                                                      |
                                                                      v
+-----------------+-----------------+-----------------+-----------------+
|  Validation     |   Execution     |   Formatting    |   Response      |
| (GraphQL.js)    |   (Mock/Real)   |   (JSON)        |   (JSON API)    |
+-----------------+-----------------+-----------------+-----------------+
```

## Detailed Step-by-Step

### 1. User Query Reception
**Input**: `POST /api/nlq` with `{ query: string }`
**Validation**: Zod schema check
**Tracing**: Langfuse trace creation

### 2. AI Planning Phase
**Model**: GPT-OSS-20B via LangChain.js
**Prompt**: Structured system prompt with operation/field listings
**Output**: Raw JSON with operation, rootField, fields, arguments
**Validation**: Zod GraphQLQueryPlan schema parsing

### 3. Entity Resolution (if needed)
**Trigger**: When arguments contain entity names
**Engine**: Fuse.js fuzzy search
**Sources**: CSV files (players.csv, teams.csv)
**Output**: Resolved IDs with confidence scores

### 4. GraphQL Compilation
**Input**: Validated GraphQLQueryPlan
**Process**: Convert to GraphQL string with proper syntax
**Special Handling**:
- Stats queries: Nested `playerGoals` arguments
- Enums: No quotes (FIRST_HALF, PLAYER)
- Complex objects: Proper GraphQL syntax

### 5. GraphQL Validation
**Engine**: GraphQL.js parse + validate
**Schema**: SDL-based schema validation
**Error Handling**: Structured ValidationError response

### 6. Query Execution
**Current**: Mock data execution
**Future**: Real GraphQL endpoint
**Stats Queries**: Dynamic data generation based on filters

### 7. Response Formatting
**Success**: `{ success: true, plan, compiledQuery, data }`
**Error**: Typed error objects with appropriate HTTP status

## Key Contracts

### Input Contract
```typescript
POST /api/nlq
Content-Type: application/json

{
  "query": "Show me Mohamed Salah goals this season"
}
```

### Output Contracts

#### Success Response
```typescript
{
  "success": true,
  "query": "original query",
  "plan": {
    "operation": "query",
    "rootField": "players",
    "arguments": { "name": "Mohamed Salah" },
    "fields": ["goals", "assists"]
  },
  "compiledQuery": "query { players(name: \"Mohamed Salah\") { goals assists } }",
  "data": { "players": [...] }
}
```

#### Error Responses
```typescript
// User Error (non-football query)
{
  "type": "UserError",
  "message": "Please ask about football/soccer statistics",
  "isNonFootballQuery": true
}

// Validation Error
{
  "type": "ValidationError",
  "message": "Invalid GraphQL query generated",
  "validationErrors": ["Field 'invalid' does not exist"],
  "plan": {...},
  "compiledQuery": "..."
}
```

## Data Sources

### Entity CSVs
- **players.csv**: id, name, canonical_name, aliases, league, team
- **teams.csv**: id, name, canonical_name, aliases, league, country

### GraphQL Schema (SDL)
- Types: Player, Team, Competition, Season, Match, StatsQuery
- Enums: MatchPeriod, StatType, SortOrder, GroupBy
- Complex queries: stats.playerGoals with filters/splits/grouping

## Error Recovery

### Single Refinement Pass
- If GraphQL validation fails, system could trigger one AI refinement
- Currently returns validation errors to client
- Future: Automatic retry with corrected prompt

### Fallback Handling
- Non-football queries: Graceful error
- Invalid JSON: Upstream error with details
- Network failures: Traced and logged

## Performance Gates

- **AI Call Budget**: <500 tokens/query
- **Latency Target**: <1s P50, <2s P95
- **Memory Limit**: <100MB
- **Concurrent Queries**: 10 simultaneous (development)
