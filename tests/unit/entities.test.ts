import { describe, it, expect } from "vitest";
import {
  resolveEntities,
  findBestPlayer,
  findBestTeam,
  findBestCompetition
} from "../../src/entities/resolve";

describe("Entity Resolution", () => {
  describe("Player Resolution", () => {
    it("should find exact player matches", () => {
      const player = findBestPlayer("Mohamed Salah");
      expect(player).toBeDefined();
      expect(player?.id).toBe("player:salah");
      expect(player?.name).toBe("Mohamed Salah");
    });

    it("should find players by partial name", () => {
      const player = findBestPlayer("Salah");
      expect(player).toBeDefined();
      expect(player?.id).toBe("player:salah");
    });

    it("should find players by nickname", () => {
      const player = findBestPlayer("Mo Salah");
      expect(player).toBeDefined();
      expect(player?.id).toBe("player:salah");
    });

    it("should return null for unknown players", () => {
      const player = findBestPlayer("Unknown Player");
      expect(player).toBeNull();
    });
  });

  describe("Team Resolution", () => {
    it("should find exact team matches", () => {
      const team = findBestTeam("Liverpool");
      expect(team).toBeDefined();
      expect(team?.id).toBe("team:liverpool");
      expect(team?.league).toBe("Premier League");
    });

    it("should find teams by short name", () => {
      const team = findBestTeam("LIV");
      expect(team).toBeDefined();
      expect(team?.id).toBe("team:liverpool");
    });

    it("should find teams by alternative names", () => {
      const team = findBestTeam("Liverpool FC");
      expect(team).toBeDefined();
      expect(team?.id).toBe("team:liverpool");
    });
  });

  describe("Competition Resolution", () => {
    it("should find exact competition matches", () => {
      const comp = findBestCompetition("Premier League");
      expect(comp).toBeDefined();
      expect(comp?.id).toBe("comp:epl");
      expect(comp?.code).toBe("EPL");
    });

    it("should find competitions by code", () => {
      const comp = findBestCompetition("EPL");
      expect(comp).toBeDefined();
      expect(comp?.id).toBe("comp:epl");
    });
  });

  describe("Multi-Entity Resolution", () => {
    it("should resolve multiple player names", () => {
      const candidates = resolveEntities(["Haaland", "Salah"]);
      expect(candidates.length).toBeGreaterThan(0);

      const playerIds = candidates.map(c => c.entity.id);
      expect(playerIds).toContain("player:haaland");
      expect(playerIds).toContain("player:salah");
    });

    it("should resolve mixed entity types", () => {
      const candidates = resolveEntities(["Salah", "Liverpool", "Premier League"]);
      expect(candidates.length).toBeGreaterThanOrEqual(3);

      const entityIds = candidates.map(c => c.entity.id);
      expect(entityIds).toContain("player:salah");
      expect(entityIds).toContain("team:liverpool");
      expect(entityIds).toContain("comp:epl");
    });

    it("should rank results by relevance", () => {
      const candidates = resolveEntities(["Liverpool"]);
      expect(candidates.length).toBeGreaterThan(0);

      // First result should be the exact team match
      expect(candidates[0].entity.id).toBe("team:liverpool");
      expect(candidates[0].score).toBeLessThan(1); // Lower score = better match
    });

    it("should limit results to top candidates", () => {
      const candidates = resolveEntities(["a", "b", "c", "d", "e"]); // Very generic terms
      expect(candidates.length).toBeLessThanOrEqual(10); // Should limit to top 10
    });
  });

  describe("Performance", () => {
    it("should resolve entities quickly", () => {
      const start = Date.now();

      resolveEntities(["Mohamed Salah", "Liverpool", "Premier League"]);

      const end = Date.now();
      const duration = end - start;

      expect(duration).toBeLessThan(50); // Should complete in less than 50ms
    });

    it("should handle fuzzy matching efficiently", () => {
      const start = Date.now();

      // Test multiple fuzzy searches
      findBestPlayer("Salah");
      findBestTeam("Man City");
      findBestCompetition("Champions League");

      const end = Date.now();
      const duration = end - start;

      expect(duration).toBeLessThan(20); // Should complete in less than 20ms
    });
  });
});
