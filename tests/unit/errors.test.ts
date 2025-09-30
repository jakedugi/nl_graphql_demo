import { describe, it, expect } from "vitest";
import { createUserError, createValidationError, createUpstreamError, NLQError } from "../../src/lib/errors";
import { GraphQLQueryPlanSchema } from "../../src/agent/schemas";

describe("Error Handling", () => {
  describe("Error Factory Functions", () => {
    it("should create user error for non-football queries", () => {
      const error = createUserError("Please ask about football/soccer statistics", true);

      expect(error).toEqual({
        type: "UserError",
        message: "Please ask about football/soccer statistics",
        isNonFootballQuery: true
      });
    });

    it("should create user error for general errors", () => {
      const error = createUserError("Something went wrong");

      expect(error).toEqual({
        type: "UserError",
        message: "Something went wrong",
        isNonFootballQuery: false
      });
    });

    it("should create validation error with details", () => {
      const plan = GraphQLQueryPlanSchema.parse({
        operation: "query",
        rootField: "players",
        fields: ["goals"]
      });

      const error = createValidationError(
        "Invalid GraphQL query generated",
        ["Field 'invalid' does not exist"],
        plan,
        "query { players { invalid } }"
      );

      expect(error.type).toBe("ValidationError");
      expect(error.message).toBe("Invalid GraphQL query generated");
      expect(error.validationErrors).toEqual(["Field 'invalid' does not exist"]);
      expect(error.plan).toEqual(plan);
      expect(error.compiledQuery).toBe("query { players { invalid } }");
    });

    it("should create upstream error with details", () => {
      const error = createUpstreamError("AI service unavailable", "Connection timeout");

      expect(error).toEqual({
        type: "UpstreamError",
        message: "AI service unavailable",
        details: "Connection timeout"
      });
    });

    it("should create upstream error without details", () => {
      const error = createUpstreamError("Unknown error");

      expect(error).toEqual({
        type: "UpstreamError",
        message: "Unknown error",
        details: undefined
      });
    });
  });

  describe("NLQError Class", () => {
    it("should create NLQError with proper properties", () => {
      const error = new NLQError("Test error", "UserError", { extra: "data" });

      expect(error.message).toBe("Test error");
      expect(error.type).toBe("UserError");
      expect(error.details).toEqual({ extra: "data" });
      expect(error.name).toBe("NLQError");
    });

    it("should handle errors without details", () => {
      const error = new NLQError("Simple error", "ValidationError");

      expect(error.message).toBe("Simple error");
      expect(error.type).toBe("ValidationError");
      expect(error.details).toBeUndefined();
    });
  });

  describe("Error Type Safety", () => {
    it("should ensure error types are properly typed", () => {
      const userError = createUserError("test");
      const validationError = createValidationError("test", [], {} as any, "query");
      const upstreamError = createUpstreamError("test");

      // Type assertions to ensure proper typing
      expect(typeof userError.type).toBe("string");
      expect(userError.type).toBe("UserError");

      expect(typeof validationError.type).toBe("string");
      expect(validationError.type).toBe("ValidationError");

      expect(typeof upstreamError.type).toBe("string");
      expect(upstreamError.type).toBe("UpstreamError");
    });
  });
});
