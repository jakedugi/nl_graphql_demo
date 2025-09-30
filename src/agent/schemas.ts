import { z } from "zod";

// GraphQL Query Plan Schema (following LangChain structured output patterns)
export const GraphQLQueryPlanSchema = z.object({
  operation: z.enum(["query", "mutation"]),
  rootField: z.string(),
  arguments: z.record(z.any()).optional(),
  fields: z.array(z.string()),
  entityLookups: z.array(z.object({
    entityType: z.enum(["player", "team", "league", "competition"]),
    searchTerm: z.string(),
  })).optional(),
});

export type GraphQLQueryPlan = z.infer<typeof GraphQLQueryPlanSchema>;

// Entity resolution schemas
export const PlayerEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()),
  league: z.string(),
  team: z.string(),
});

export const TeamEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()),
  league: z.string(),
  country: z.string(),
});

export const CompetitionEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()),
  country: z.string(),
  code: z.string(),
});

export type PlayerEntity = z.infer<typeof PlayerEntitySchema>;
export type TeamEntity = z.infer<typeof TeamEntitySchema>;
export type CompetitionEntity = z.infer<typeof CompetitionEntitySchema>;

export const EntityCandidateSchema = z.object({
  entity: z.union([PlayerEntitySchema, TeamEntitySchema, CompetitionEntitySchema]),
  score: z.number(),
  matches: z.array(z.any()), // Fuse.js match objects - flexible typing
});

export type EntityCandidate = z.infer<typeof EntityCandidateSchema>;

// Error schemas
export const UserErrorSchema = z.object({
  type: z.literal("UserError"),
  message: z.string(),
  isNonFootballQuery: z.boolean().optional(),
});

export const ValidationErrorSchema = z.object({
  type: z.literal("ValidationError"),
  message: z.string(),
  validationErrors: z.array(z.string()),
  plan: GraphQLQueryPlanSchema,
  compiledQuery: z.string(),
});

export const UpstreamErrorSchema = z.object({
  type: z.literal("UpstreamError"),
  message: z.string(),
  details: z.string().optional(),
});

export type UserError = z.infer<typeof UserErrorSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type UpstreamError = z.infer<typeof UpstreamErrorSchema>;
