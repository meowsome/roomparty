import type { Player } from "./player";


// The state that every client can see (including unassigned clients).
export type BaseGameStateView = {
    revision: number;
    host: boolean;
    players: Record<string, Player>;
};

// Information that a host can see.
export type HostGameStateView = BaseGameStateView & {
    counter: number;
};

// Information that a player can see.
export type PlayerGameStateView = BaseGameStateView & {
    counter: number;
};

// The union of all possible game state views that can be sent to the client.
export type ClientGameStateView =
    | BaseGameStateView
    | HostGameStateView
    | PlayerGameStateView