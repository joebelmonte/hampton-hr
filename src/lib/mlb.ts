const MLB_API = "https://statsapi.mlb.com/api/v1";
export async function todaysSchedule(date = new Date().toISOString().slice(0, 10)) { const response = await fetch(`${MLB_API}/schedule?sportId=1&date=${date}`, { next: { revalidate: 0 } }); if (!response.ok) throw new Error("Unable to load MLB schedule"); return response.json(); }
export async function gameBoxscore(gamePk: number) { const response = await fetch(`${MLB_API}/game/${gamePk}/boxscore`, { next: { revalidate: 0 } }); if (!response.ok) throw new Error(`Unable to load boxscore for ${gamePk}`); return response.json(); }
export async function gamePlayByPlay(gamePk: number) { const response = await fetch(`${MLB_API}/game/${gamePk}/playByPlay`, { next: { revalidate: 0 } }); if (!response.ok) throw new Error(`Unable to load play-by-play for game ${gamePk}`); return response.json(); }

export async function mlbPlayer(mlbPlayerId: number) {
  if (!Number.isInteger(mlbPlayerId) || mlbPlayerId <= 0) throw new Error("Enter a valid MLB player ID.");
  const response = await fetch(`${MLB_API}/people/${mlbPlayerId}`, { next: { revalidate: 86_400 } });
  if (!response.ok) throw new Error("No MLB player was found for that MLBAM ID.");
  const payload = await response.json() as { people?: { id: number; fullName: string; active: boolean }[] };
  const player = payload.people?.[0];
  if (!player?.fullName) throw new Error("No MLB player was found for that MLBAM ID.");
  return player;
}
