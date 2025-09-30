import { PlayerEntity, TeamEntity, CompetitionEntity } from '../agent/schemas';
import { loadPlayersFromCSV, loadTeamsFromCSV, loadCompetitionsFromCSV } from './dataLoader';

// Unified data provider that loads all entity data
class DataProvider {
  private _players: PlayerEntity[] | null = null;
  private _teams: TeamEntity[] | null = null;
  private _competitions: CompetitionEntity[] | null = null;

  get players(): PlayerEntity[] {
    if (!this._players) {
      this._players = loadPlayersFromCSV();
    }
    return this._players;
  }

  get teams(): TeamEntity[] {
    if (!this._teams) {
      this._teams = loadTeamsFromCSV();
    }
    return this._teams;
  }

  get competitions(): CompetitionEntity[] {
    if (!this._competitions) {
      this._competitions = loadCompetitionsFromCSV();
    }
    return this._competitions;
  }

  // Helper methods for lookups
  getPlayerById(id: string): PlayerEntity | undefined {
    return this.players.find(p => p.id === id);
  }

  getTeamById(id: string): TeamEntity | undefined {
    return this.teams.find(t => t.id === id);
  }

  getCompetitionById(id: string): CompetitionEntity | undefined {
    return this.competitions.find(c => c.id === id);
  }
}

// Singleton instance
export const dataProvider = new DataProvider();

// Export individual getters for convenience
export const getPlayers = () => dataProvider.players;
export const getTeams = () => dataProvider.teams;
export const getCompetitions = () => dataProvider.competitions;
export const getPlayerById = (id: string) => dataProvider.getPlayerById(id);
export const getTeamById = (id: string) => dataProvider.getTeamById(id);
export const getCompetitionById = (id: string) => dataProvider.getCompetitionById(id);
