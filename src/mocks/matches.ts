// Mock match data for football statistics
export const MOCK_MATCHES = [
  {
    id: "match:1",
    homeTeam: { id: "team:liverpool", name: "Liverpool" },
    awayTeam: { id: "team:city", name: "Manchester City" },
    homeScore: 2,
    awayScore: 1,
    date: "2024-11-15",
    utcKickoff: "2024-11-15T17:30:00Z",
    round: "Matchday 12",
    fixtureId: "fix_12_001",
    dayOfWeek: "Sunday",
    referee: { id: "ref:oliver", name: "Michael Oliver", nationality: "England" },
    season: { id: "season:2024-25", label: "2024/25" },
    competition: { id: "comp:epl", name: "Premier League" }
  },
  {
    id: "match:2",
    homeTeam: { id: "team:arsenal", name: "Arsenal" },
    awayTeam: { id: "team:liverpool", name: "Liverpool" },
    homeScore: 1,
    awayScore: 3,
    date: "2024-11-08",
    utcKickoff: "2024-11-08T16:00:00Z",
    round: "Matchday 11",
    fixtureId: "fix_11_005",
    dayOfWeek: "Saturday",
    referee: { id: "ref:taylor", name: "Anthony Taylor", nationality: "England" },
    season: { id: "season:2024-25", label: "2024/25" },
    competition: { id: "comp:epl", name: "Premier League" }
  }
];
