import { MOCK_PLAYERS } from './players';
import { MOCK_TEAMS } from './teams';
import { MOCK_SEASONS } from './seasons';
import { MOCK_COMPETITIONS } from './competitions';
import { MOCK_MATCHES } from './matches';
import type { GraphQLQueryPlan } from '../agent/schemas';

// Generate mock time-bucketed goal data with filter support
export function generatePlayerGoalStats(playerIds: string[], filter?: Record<string, any>) {
  const period = filter?.period || "FULL_TIME";
  const bucketSize = filter?.split?.timeInterval?.sizeMinutes || 15;
  const seasonRange = filter?.seasons;

  // Generate time buckets based on period and bucket size
  const timeBuckets = [];
  if (period === "FIRST_HALF") {
    for (let i = 0; i < 45; i += bucketSize) {
      const end = Math.min(i + bucketSize - 1, 45);
      timeBuckets.push({
        label: `${i}-${end}`,
        startMinute: i,
        endMinute: end
      });
    }
  } else {
    // Full game buckets
    for (let i = 0; i < 90; i += bucketSize) {
      const end = Math.min(i + bucketSize - 1, 90);
      timeBuckets.push({
        label: `${i}-${end}`,
        startMinute: i,
        endMinute: end
      });
    }
  }

  const seasons = seasonRange ?
    MOCK_SEASONS.filter(s => s.label >= seasonRange.from && s.label <= seasonRange.to) :
    [MOCK_SEASONS[0]];

  const rows = [];
  const players = MOCK_PLAYERS.filter(p => playerIds.includes(p.id));

  for (const player of players) {
    for (const season of seasons) {
      for (const bucket of timeBuckets) {
        // Generate realistic goal distribution
        const isFirstHalf = bucket.endMinute <= 45;
        const baseGoals = isFirstHalf ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3);
        const playerMultiplier = player.name === "Erling Haaland" ? 1.5 :
                               player.name === "Mohamed Salah" ? 1.3 : 1.0;
        const goals = Math.floor(baseGoals * playerMultiplier);

        if (goals > 0) {
          rows.push({
            player: {
              id: player.id,
              name: player.name
            },
            season,
            competition: MOCK_COMPETITIONS[0],
            bucket,
            goals,
            assists: Math.floor(Math.random() * 2),
            shots: goals * 2 + Math.floor(Math.random() * 3),
            xg: (goals * 0.8 + Math.random() * 0.4).toFixed(2),
            match: MOCK_MATCHES[0]
          });
        }
      }
    }
  }

  return { rows, totalRows: rows.length };
}

// Mock execution for demo (replace with real GraphQL endpoint)
export function executeMockQuery(plan: GraphQLQueryPlan): any {
  switch (plan.rootField) {
    case "players":
      return { players: MOCK_PLAYERS };
    case "teams":
      return { teams: MOCK_TEAMS };
    case "matches":
      return { matches: MOCK_MATCHES };
    case "competitions":
      return { competitions: MOCK_COMPETITIONS };
    case "seasons":
      return { seasons: MOCK_SEASONS };
    case "stats":
      // Handle advanced statistical queries
      const filter = plan.arguments?.filter;
      const playerIds = filter?.players || ["player:salah", "player:haaland", "player:de_bruyne"];
      const goalStats = generatePlayerGoalStats(playerIds, filter);

      return {
        stats: {
          playerGoals: goalStats
        }
      };
    default:
      return { data: "Mock response - implement real GraphQL endpoint" };
  }
}
