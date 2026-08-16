export type ScheduledGame = { gamePk?: number; officialDate?: string; gameType?: string; status?: { abstractGameState?: string } };

/** The league scores MLB games except the All-Star Game (game type "A"). */
export function isCountedMlbGame(game: ScheduledGame) {
  return Boolean(game.gamePk && game.officialDate && game.gameType !== "A" && ["Live", "Final"].includes(game.status?.abstractGameState ?? ""));
}
