// This file contains the types for the game state. It is used in both the server and the client.

import { Player } from "./model/player";

export type GameState = {
    counter: number;

    host: boolean;

    players: Record<string, Player>;
};