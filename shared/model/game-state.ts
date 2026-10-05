// This file contains the types for the game state. It is used in both the server and the client.

import type { Player } from "./player.js";

export type GamePhase =
    | "VOTING"
    | "RESULTS"
    | "WORD_CLOUD";

export type Vote = {
    optionId: string | null;
    freeformText: string;
};

export type VoteOption = {
    id: string;
    imageLink: string;
};

export type Round = {
    options: VoteOption[];
    votes: Record<string, Vote>; // playerId-keyed submissions
}; 



export type GameState = {
    revision: number;
    host: boolean;
    players: Record<string, Player>;

    phase: GamePhase;
    currentRound: number;
    rounds: Round[];
};