import type { GamePhase, Vote, VoteOption } from "./game-state.js";
import type { Player } from "./player.js";


// The state that every client can see (including unassigned clients).
export type BaseGameStateView = {
    revision: number;
    host: boolean;
    players: Record<string, Player>;

    phase: GamePhase;
    currentRound: number;
};

// Information that a host can see.
export type HostGameStateView = BaseGameStateView & {
    actor: {
        type: "HOST";
    };
    currentOptions: VoteOption[]; // The options available to the player in the current round.
    currentVotes: Record<string, Vote>; // All votes cast by players in the current round, keyed by player ID.
};

// Information that a player can see.
export type PlayerGameStateView = BaseGameStateView & {
    actor: {
        type: "PLAYER";
        playerId: string;
    };
    currentOptions: VoteOption[]; // The options available to the player in the current round.
    currentVote: Vote | null; // The player's own vote, if they have cast one.
};

// Information that an unassigned player can see.
export type UnassignedGameStateView = BaseGameStateView & {
    actor: {
        type: "UNASSIGNED";
    };
};

// The union of all possible game state views that can be sent to the client.
export type ClientGameStateView =
    | HostGameStateView
    | PlayerGameStateView
    | UnassignedGameStateView