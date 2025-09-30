import Fuse from "fuse.js";
import { PlayerEntity, TeamEntity, CompetitionEntity, EntityCandidate } from "../agent/schemas";
import { getPlayers, getTeams, getCompetitions } from "./dataProvider";

// Load entity data for fuzzy matching
const PLAYERS: PlayerEntity[] = getPlayers();
const TEAMS: TeamEntity[] = getTeams();
const COMPETITIONS: CompetitionEntity[] = getCompetitions();

// Fuse.js configurations
const playerSearch = new Fuse(PLAYERS, {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "canonicalName", weight: 0.4 },
    { name: "aliases", weight: 0.2 }
  ],
  threshold: 0.3,
  includeMatches: true,
  includeScore: true,
});

const teamSearch = new Fuse(TEAMS, {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "canonicalName", weight: 0.4 },
    { name: "aliases", weight: 0.2 }
  ],
  threshold: 0.3,
  includeMatches: true,
  includeScore: true,
});

const competitionSearch = new Fuse(COMPETITIONS, {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "canonicalName", weight: 0.4 },
    { name: "aliases", weight: 0.2 }
  ],
  threshold: 0.3,
  includeMatches: true,
  includeScore: true,
});

export function resolveEntities(names: string[]): EntityCandidate[] {
  const candidates: EntityCandidate[] = [];

  for (const name of names) {
    // Search players
    const playerResults = playerSearch.search(name, { limit: 3 });
    for (const result of playerResults) {
      candidates.push({
        entity: result.item,
        score: result.score || 0,
        matches: (result.matches || []) as any[],
      });
    }

    // Search teams
    const teamResults = teamSearch.search(name, { limit: 3 });
    for (const result of teamResults) {
      candidates.push({
        entity: result.item,
        score: result.score || 0,
        matches: (result.matches || []) as any[],
      });
    }

    // Search competitions
    const compResults = competitionSearch.search(name, { limit: 3 });
    for (const result of compResults) {
      candidates.push({
        entity: result.item,
        score: result.score || 0,
        matches: (result.matches || []) as any[],
      });
    }
  }

  // Sort by score (lower is better) and return top candidates
  return candidates
    .sort((a, b) => a.score - b.score)
    .slice(0, 10); // Return top 10 candidates
}

export function findBestPlayer(searchTerm: string): PlayerEntity | null {
  const results = playerSearch.search(searchTerm, { limit: 1 });
  return results.length > 0 ? results[0].item : null;
}

export function findBestTeam(searchTerm: string): TeamEntity | null {
  const results = teamSearch.search(searchTerm, { limit: 1 });
  return results.length > 0 ? results[0].item : null;
}

export function findBestCompetition(searchTerm: string): CompetitionEntity | null {
  const results = competitionSearch.search(searchTerm, { limit: 1 });
  return results.length > 0 ? results[0].item : null;
}

// Export raw data for tests
export { PLAYERS, TEAMS, COMPETITIONS };
