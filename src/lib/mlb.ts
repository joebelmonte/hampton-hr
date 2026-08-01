const MLB_API = "https://statsapi.mlb.com/api/v1";
export async function todaysSchedule(date = new Date().toISOString().slice(0, 10)) { const response = await fetch(`${MLB_API}/schedule?sportId=1&date=${date}`, { next: { revalidate: 0 } }); if (!response.ok) throw new Error("Unable to load MLB schedule"); return response.json(); }
export async function gameBoxscore(gamePk: number) { const response = await fetch(`${MLB_API}/game/${gamePk}/boxscore`, { next: { revalidate: 0 } }); if (!response.ok) throw new Error(`Unable to load boxscore for ${gamePk}`); return response.json(); }
