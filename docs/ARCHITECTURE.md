# NL-GraphQL Architecture

## Overview

A TypeScript system that converts natural language queries into GraphQL operations. Uses SOC (Separation of Concerns) and SSOT (Single Source of Truth) design patterns.

## Core Components

### 1. Application Layer (`/src/app/`)
- **Purpose**: Next.js web application with API endpoints and UI
- **Key Files**:
  - `page.tsx`: Main NL-GraphQL interface and demo
  - `layout.tsx`: Root layout component
  - `api/nlq/route.ts`: Natural language query processing endpoint
  - `api/copilotkit/route.ts`: Copilot chat completion endpoint

### 2. Agent Layer (`/src/agent/`)
- **Purpose**: AI model interaction and structured output validation
- **Key Files**:
  - `schemas.ts`: Zod schemas for all data types and API contracts
  - Contains GraphQLQueryPlan, entity schemas, and error types

### 3. GraphQL Layer (`/src/graphql/`)
- **Purpose**: GraphQL compilation, validation, and schema management
- **Key Files**:
  - `compiler.ts`: Converts plans to GraphQL strings with embedded schema SDL

### 4. Entity Resolution (`/src/entities/`)
- **Purpose**: Fuzzy search and entity disambiguation with CSV data loading
- **Key Files**:
  - `resolve.ts`: Fuse.js-powered entity lookup for players, teams, competitions
  - `dataLoader.ts`: CSV parsing for entity data
  - `dataProvider.ts`: Unified data access layer

### 5. Configuration (`/src/config/`)
- **Purpose**: Centralized constants and environment validation
- **Key Files**:
  - `constants.ts`: API constants, HTTP headers, file paths, defaults
  - `env.ts`: Zod-validated environment configuration

### 6. Library (`/src/lib/`)
- **Purpose**: Shared utilities and cross-cutting concerns
- **Key Files**:
  - `errors.ts`: Typed error classes and factory functions
  - `tracing.ts`: Langfuse integration for observability

## Data Flow

See `/docs/DATA_FLOW.md` for detailed request processing pipeline and contracts.

## Key Design Decisions

### Type Safety First
- All data structures validated with Zod schemas
- Strict TypeScript with no `any` types
- Runtime type checking for external inputs

### Error Handling
- Typed error classes: `UserError`, `ValidationError`, `UpstreamError`
- Graceful degradation for non-football queries
- Comprehensive error logging and tracing

### Entity Resolution
- Fuzzy matching prevents exact name requirements
- Multiple aliases supported per entity
- Score-based ranking for ambiguity resolution
- CSV-based data loading with unified provider pattern

### Data Management (SSOT)
- **Entity Data**: CSV files in `/tests/fixtures/` (players.csv, teams.csv, competitions.csv)
- **Configuration**: Centralized constants in `/src/config/constants.ts`
- **Environment**: Zod-validated env vars with defaults
- **Mock Data**: Consistent with entity definitions for testing

### GraphQL Safety
- All generated queries validated against schema
- Enum values handled correctly (no quotes)
- Complex argument serialization for nested structures

### Application Architecture
- Next.js App Router for API routes and UI
- Server-side API processing with streaming responses
- Client-side React interface with real-time query results
- Environment-based configuration for development/production

## External Dependencies

### Core
- **Next.js**: React framework with App Router for API routes and UI
- **LangChain.js**: Structured output and AI model integration
- **Groq SDK**: Direct AI model API access
- **Zod**: Runtime type validation
- **GraphQL.js**: Schema validation and AST operations
- **Fuse.js**: Fuzzy entity search
- **PapaParse**: CSV data loading

### Optional
- **Langfuse**: Observability and tracing (no-op if not configured)

## Performance Considerations

See `/docs/PERF.md` for detailed performance analysis and cost estimates.

