// This file contains the types for the game state. It is used in both the server and the client.

export type Player = {
    name: string;
};

export type GameState = {
    counter: number;

    host: boolean;

    players: Record<string, Player>;
};