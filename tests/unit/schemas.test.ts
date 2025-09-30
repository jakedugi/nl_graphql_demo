import { describe, it, expect } from "vitest";
import { GraphQLQueryPlanSchema, UserErrorSchema, ValidationErrorSchema, UpstreamErrorSchema } from "../../src/agent/schemas";

describe("Schema Validation", () => {
  describe("GraphQLQueryPlan Schema", () => {
    it("should validate valid query plans", () => {
      const validPlan = {
        operation: "query" as const,
        rootField: "players",
        arguments: { name: "Mohamed Salah" },
        fields: ["goals", "assists"]
      };

      const result = GraphQLQueryPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validPlan);
    });

    it("should validate complex stats query plans", () => {
      const complexPlan = {
        operation: "query" as const,
        rootField: "stats",
        arguments: {
          filter: {
            players: ["player:haaland"],
            competitions: ["comp:epl"],
            seasons: { from: "2022/23", to: "2025/26" },
            period: "FIRST_HALF"
          },
          split: { timeInterval: { sizeMinutes: 15 } },
          groupBy: ["PLAYER", "TIME_INTERVAL", "SEASON"]
        },
        fields: ["playerGoals"]
      };

      const result = GraphQLQueryPlanSchema.safeParse(complexPlan);
      expect(result.success).toBe(true);
      expect(result.data?.arguments?.filter?.period).toBe("FIRST_HALF");
    });

    it("should reject invalid operations", () => {
      const invalidPlan = {
        operation: "invalid" as any,
        rootField: "players",
        fields: ["goals"]
      };

      const result = GraphQLQueryPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const invalidPlan = {
        operation: "query" as const,
        rootField: "players"
        // Missing fields array
      };

      const result = GraphQLQueryPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
    });

    it("should allow optional arguments", () => {
      const planWithoutArgs = {
        operation: "query" as const,
        rootField: "players",
        fields: ["goals"]
      };

      const result = GraphQLQueryPlanSchema.safeParse(planWithoutArgs);
      expect(result.success).toBe(true);
      expect(result.data?.arguments).toBeUndefined();
    });

    it("should allow optional entity lookups", () => {
      const planWithoutLookups = {
        operation: "query" as const,
        rootField: "players",
        fields: ["goals"]
      };

      const result = GraphQLQueryPlanSchema.safeParse(planWithoutLookups);
      expect(result.success).toBe(true);
      expect(result.data?.entityLookups).toBeUndefined();
    });
  });

  describe("Error Schemas", () => {
    it("should validate UserError schema", () => {
      const userError = {
        type: "UserError" as const,
        message: "Please ask about football",
        isNonFootballQuery: true
      };

      const result = UserErrorSchema.safeParse(userError);
      expect(result.success).toBe(true);
      expect(result.data?.isNonFootballQuery).toBe(true);
    });

    it("should validate ValidationError schema", () => {
      const validationError = {
        type: "ValidationError" as const,
        message: "Invalid query",
        validationErrors: ["Field missing"],
        plan: {
          operation: "query" as const,
          rootField: "players",
          fields: ["goals"]
        },
        compiledQuery: "query { players { goals } }"
      };

      const result = ValidationErrorSchema.safeParse(validationError);
      expect(result.success).toBe(true);
      expect(result.data?.validationErrors).toEqual(["Field missing"]);
    });

    it("should validate UpstreamError schema", () => {
      const upstreamError = {
        type: "UpstreamError" as const,
        message: "Service unavailable",
        details: "Connection timeout"
      };

      const result = UpstreamErrorSchema.safeParse(upstreamError);
      expect(result.success).toBe(true);
      expect(result.data?.details).toBe("Connection timeout");
    });
  });

  describe("Schema Performance", () => {
    it("should parse schemas quickly", () => {
      const start = Date.now();

      // Test multiple schema validations
      const plans = [
        { operation: "query" as const, rootField: "players", fields: ["goals"] },
        { operation: "query" as const, rootField: "teams", fields: ["name"] },
        { operation: "query" as const, rootField: "matches", fields: ["date"] }
      ];

      for (const plan of plans) {
        GraphQLQueryPlanSchema.parse(plan);
      }

      const end = Date.now();
      const duration = end - start;

      expect(duration).toBeLessThan(50); // Should complete in less than 50ms
    });

    it("should handle error schemas efficiently", () => {
      const start = Date.now();

      const errors = [
        UserErrorSchema.parse({ type: "UserError", message: "test" }),
        ValidationErrorSchema.parse({
          type: "ValidationError",
          message: "test",
          validationErrors: [],
          plan: { operation: "query", rootField: "players", fields: [] },
          compiledQuery: "query"
        }),
        UpstreamErrorSchema.parse({ type: "UpstreamError", message: "test" })
      ];

      const end = Date.now();
      const duration = end - start;

      expect(errors.length).toBe(3);
      expect(duration).toBeLessThan(20); // Should complete in less than 20ms
    });
  });
});
