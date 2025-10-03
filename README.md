# NL-GraphQL Demo

Converts natural language queries about football stats into GraphQL operations using Groq AI.

## Quick Start

```bash
npm install
cp env.example .env.local  # Add your GROQ_API_KEY
npm run dev
```

Visit http://localhost:3000 and try queries like:
- "Show me Mohamed Salah's goals this season"
- "What teams are in the Premier League"
- "Liverpool recent matches"

## Test

```bash
npm test
npm run build
```