# NL-GraphQL

Converts natural language queries into GraphQL operations.

## Setup

```bash
npm install
cp .env.example .env.local  # Add GROQ_API_KEY
npm run dev
```

Visit http://localhost:3000 and try queries like:
- "Show me Mohamed Salah's goals this season"
- "What teams are in the Premier League"

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Data Flow](docs/DATA_FLOW.md)
- [Performance](docs/PERF.md)
- [Samples](docs/NLQ_SAMPLES.md)

## Test

```bash
npm test
npm run build
```