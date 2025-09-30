import { describe, it, expect, beforeAll } from "vitest";
import { compileQueryPlan, validateQuery } from "../../src/graphql/compiler";
import { GraphQLQueryPlanSchema } from "../../src/agent/schemas";

describe("GraphQL Compiler", () => {
  describe("Simple Queries", () => {
    it("should compile player query with name filter", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "players",
        arguments: { name: "Mohamed Salah" },
        fields: ["goals", "assists"]
      });

      const compiled = compileQueryPlan(plan);
      expect(compiled).toContain('query {');
      expect(compiled).toContain('players(name: "Mohamed Salah") {');
      expect(compiled).toContain('goals');
      expect(compiled).toContain('assists');

      const validation = validateQuery(compiled);
      expect(validation.isValid).toBe(true);
    });

    it("should compile player query with multiple names", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "players",
        arguments: { names: ["Haaland", "Salah"] },
        fields: ["name", "goals"]
      });

      const compiled = compileQueryPlan(plan);
      expect(compiled).toContain('players(names: ["Haaland", "Salah"]) {');
      expect(compiled).toContain('name');
      expect(compiled).toContain('goals');

      const validation = validateQuery(compiled);
      expect(validation.isValid).toBe(true);
    });

    it("should compile team query with league filter", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "teams",
        arguments: { league: "Premier League" },
        fields: ["id", "name", "shortName"]
      });

      const compiled = compileQueryPlan(plan);
      expect(compiled).toContain('teams(league: "Premier League") {');
      expect(compiled).toContain('id');
      expect(compiled).toContain('name');
      expect(compiled).toContain('shortName');

      const validation = validateQuery(compiled);
      expect(validation.isValid).toBe(true);
    });

    it("should compile matches query with team filter", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "matches",
        arguments: { team: "Liverpool" },
        fields: ["id", "homeScore", "awayScore", "date"]
      });

      const compiled = compileQueryPlan(plan);
      expect(compiled).toContain('matches(team: "Liverpool") {');
      expect(compiled).toContain('id');
      expect(compiled).toContain('homeScore');

      const validation = validateQuery(compiled);
      expect(validation.isValid).toBe(true);
    });
  });

  describe("Complex Statistical Queries", () => {
    it("should compile time-bucketed goals query", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "stats",
        arguments: {
          filter: {
            players: ["player:haaland", "player:salah"],
            competitions: ["comp:epl"],
            seasons: { from: "2022/23", to: "2025/26" },
            period: "FIRST_HALF"
          },
          split: { timeInterval: { sizeMinutes: 15 } },
          groupBy: ["PLAYER", "TIME_INTERVAL", "SEASON"]
        },
        fields: ["playerGoals"]
      });

      const compiled = compileQueryPlan(plan);
      expect(compiled).toContain('query {');
      expect(compiled).toContain('stats {');
      expect(compiled).toContain('playerGoals(');
      expect(compiled).toContain('filter:');
      expect(compiled).toContain('split:');
      expect(compiled).toContain('groupBy:');

      const validation = validateQuery(compiled);
      expect(validation.isValid).toBe(true);
    });

    it("should handle enum values correctly without quotes", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "stats",
        arguments: {
          filter: {
            players: ["player:salah"],
            period: "FIRST_HALF"
          },
          groupBy: ["PLAYER", "SEASON"]
        },
        fields: ["playerGoals"]
      });

      const compiled = compileQueryPlan(plan);
      expect(compiled).toContain('period: FIRST_HALF');
      expect(compiled).toContain('groupBy: [PLAYER, SEASON]');
      expect(compiled).not.toContain('"FIRST_HALF"');
      expect(compiled).not.toContain('"PLAYER"');

      const validation = validateQuery(compiled);
      expect(validation.isValid).toBe(true);
    });

    it("should handle complex filter arguments", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "stats",
        arguments: {
          filter: {
            players: ["player:salah"],
            competitions: ["comp:epl"],
            seasons: { from: "2023/24", to: "2023/24" }
          },
          sort: { by: "GOALS", order: "DESC" }
        },
        fields: ["playerGoals"]
      });

      const compiled = compileQueryPlan(plan);
      expect(compiled).toContain('players: ["player:salah"]');
      expect(compiled).toContain('competitions: ["comp:epl"]');
      expect(compiled).toContain('seasons: {from: "2023/24", to: "2023/24"}');
      expect(compiled).toContain('sort:');

      const validation = validateQuery(compiled);
      expect(validation.isValid).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid GraphQL syntax", () => {
      const invalidQuery = "query { invalid syntax {{{";
      const validation = validateQuery(invalidQuery);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should handle missing required fields", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "players",
        fields: []
      });

      const compiled = compileQueryPlan(plan);
      // Should still compile but may not be valid against schema
      expect(compiled).toContain('query {');
      expect(compiled).toContain('players {');
    });
  });

  describe("Performance", () => {
    it("should compile queries quickly", () => {
      const start = Date.now();

      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "players",
        arguments: { name: "Mohamed Salah" },
        fields: ["goals", "assists", "shots"]
      });

      const compiled = compileQueryPlan(plan);
      const validation = validateQuery(compiled);

      const end = Date.now();
      const duration = end - start;

      expect(validation.isValid).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
