# NLQ Samples & Gold Standard

## Overview

This document contains sample natural language queries and their expected GraphQL plans. These serve as:
- Test fixtures for the NL-GraphQL pipeline
- Gold standard for AI model evaluation
- Documentation for supported query patterns

## Query Categories

### 1. Basic Player Queries

#### Query: "Show me Mohamed Salah goals and assists this season"
**Expected Plan:**
```json
{
  "operation": "query",
  "rootField": "players",
  "arguments": {
    "name": "Mohamed Salah"
  },
  "fields": ["goals", "assists"]
}
```
**Expected Result:** Player stats for Mohamed Salah

#### Query: "Show me goals of Haaland and Salah"
**Expected Plan:**
```json
{
  "operation": "query",
  "rootField": "players",
  "arguments": {
    "names": ["Haaland", "Salah"]
  },
  "fields": ["name", "goals"]
}
```
**Expected Result:** Filtered list of players with goals

### 2. Team Queries

#### Query: "What teams are in the Premier League"
**Expected Plan:**
```json
{
  "operation": "query",
  "rootField": "teams",
  "arguments": {
    "league": "Premier League"
  },
  "fields": ["id", "name", "shortName", "country", "manager"]
}
```
**Expected Result:** Teams in Premier League

#### Query: "Liverpool recent matches"
**Expected Plan:**
```json
{
  "operation": "query",
  "rootField": "matches",
  "arguments": {
    "team": "Liverpool"
  },
  "fields": ["id", "homeScore", "awayScore", "date", "utcKickoff", "round"]
}
```
**Expected Result:** Liverpool's recent matches

### 3. Competition Queries

#### Query: "Show me all competitions"
**Expected Plan:**
```json
{
  "operation": "query",
  "rootField": "competitions",
  "fields": ["id", "name", "country", "code", "level"]
}
```
**Expected Result:** List of all competitions

### 4. Complex Statistical Queries

#### Query: "Show me all goals of Erling Haaland, Kevin de Bruyne and Mo Salah that they scored in the first half in the season 2022/23 to 2025/26 in the Premier League, break it down in 15min buckets and group it by season"
**Expected Plan:**
```json
{
  "operation": "query",
  "rootField": "stats",
  "arguments": {
    "filter": {
      "players": ["player:haaland", "player:de_bruyne", "player:salah"],
      "competitions": ["comp:epl"],
      "seasons": {
        "from": "2022/23",
        "to": "2025/26"
      },
      "period": "FIRST_HALF"
    },
    "split": {
      "timeInterval": {
        "sizeMinutes": 15
      }
    },
    "groupBy": ["PLAYER", "TIME_INTERVAL", "SEASON"]
  },
  "fields": ["playerGoals"]
}
```
**Expected Result:** Time-bucketed goal statistics for specified players

### 5. Edge Cases & Error Handling

#### Query: "What's the weather like today?"
**Expected Response:**
```json
{
  "type": "UserError",
  "message": "Please ask about football/soccer statistics",
  "isNonFootballQuery": true
}
```

#### Query: "Show me Messi goals" (if Messi not in dataset)
**Expected Response:** Empty results or appropriate not found message

## Supported Query Patterns

### Time-based Queries
- "first half", "second half", "extra time"
- "15min buckets", "30min intervals"
- "2022/23 season", "2022/23 to 2025/26"

### Entity Variations
- Full names: "Mohamed Salah", "Erling Haaland"
- Nicknames: "Mo Salah", "Haaland"
- Team names: "Liverpool", "Manchester City", "LIV", "MCI"

### Statistical Metrics
- Goals, assists, shots, xG, xGOT
- Minutes played, appearances
- Pass completion, tackles, saves

### Grouping Options
- By player, season, competition, match
- Time intervals, day of week
- Opponents, referees, rounds

## Implementation Notes

### Entity Resolution
- Uses fuzzy matching with confidence scores
- Supports multiple aliases per entity
- Returns top candidates for ambiguous queries

### Validation Rules
- All generated GraphQL must validate against schema
- Enum values must be exact (FIRST_HALF, not "first_half")
- Field names must exist in schema

### Error Handling
- Non-football queries: Graceful rejection
- Invalid queries: Detailed validation errors
- Network issues: Traced upstream errors

## Testing Strategy

### Unit Tests
- Schema validation
- GraphQL compilation
- Entity resolution accuracy
- Error handling paths

### Integration Tests
- End-to-end query processing
- API response formats
- Performance benchmarks

### Gold Standard Evaluation
- Compare AI-generated plans against expected plans
- Measure accuracy, completeness, and correctness
- Track improvements over time


