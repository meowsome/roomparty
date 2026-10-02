// This file contains the types for the game state. It is used in both the server and the client.

import type { Player } from "./player";

export type GameState = {
    revision: number;

    counter: number;

    host: boolean;

    players: Record<string, Player>;
};