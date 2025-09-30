import Papa from 'papaparse';
import { PlayerEntity, TeamEntity, CompetitionEntity } from '../agent/schemas';
import path from 'path';
import fs from 'fs';
import { DEFAULTS, PATHS } from '../config/constants';

interface PlayerCSVRow {
  id: string;
  name: string;
  canonical_name: string;
  aliases: string;
  league: string;
  team: string;
}

interface TeamCSVRow {
  id: string;
  name: string;
  canonical_name: string;
  aliases: string;
  league: string;
  country: string;
}

interface CompetitionCSVRow {
  id: string;
  name: string;
  canonical_name: string;
  aliases: string;
  country: string;
  code: string;
}

function parseAliases(aliasesStr: string): string[] {
  if (!aliasesStr.trim()) return [];
  return aliasesStr.split(',').map(alias => alias.trim());
}

export function loadPlayersFromCSV(): PlayerEntity[] {
  const csvPath = path.join(process.cwd(), PATHS.PLAYERS_CSV);
  const csvContent = fs.readFileSync(csvPath, DEFAULTS.ENCODING);

  const result = Papa.parse<PlayerCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  return result.data.map(row => ({
    id: row.id,
    name: row.name,
    canonicalName: row.canonical_name,
    aliases: parseAliases(row.aliases),
    league: row.league,
    team: row.team,
  }));
}

export function loadTeamsFromCSV(): TeamEntity[] {
  const csvPath = path.join(process.cwd(), PATHS.TEAMS_CSV);
  const csvContent = fs.readFileSync(csvPath, DEFAULTS.ENCODING);

  const result = Papa.parse<TeamCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  return result.data.map(row => ({
    id: row.id,
    name: row.name,
    canonicalName: row.canonical_name,
    aliases: parseAliases(row.aliases),
    league: row.league,
    country: row.country,
  }));
}

export function loadCompetitionsFromCSV(): CompetitionEntity[] {
  const csvPath = path.join(process.cwd(), PATHS.COMPETITIONS_CSV);
  const csvContent = fs.readFileSync(csvPath, DEFAULTS.ENCODING);

  const result = Papa.parse<CompetitionCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  return result.data.map(row => ({
    id: row.id,
    name: row.name,
    canonicalName: row.canonical_name,
    aliases: parseAliases(row.aliases),
    country: row.country,
    code: row.code,
  }));
}

// Export alias for backwards compatibility
export const loadCompetitions = loadCompetitionsFromCSV;
