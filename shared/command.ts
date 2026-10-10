// The various commands that can be sent to the server. These are handled in the `handleCommand` function in `game/rules.ts`.
// They generate events that are applied to the game state in `server/room.ts` using the `applyEvent` function.

import type { GameEvent } from "./event.js";
import type { Vote } from "./model/game-state.js";

export type Command =
    | { type: "BECOME"; role: "HOST"; desiredName: string; }
    | { type: "BECOME"; role: "PLAYER"; desiredName: string; }
    | { type: "DESTROY_SELF"; }
    | { type: "DESTROY_PLAYER"; playerId: string}

    | { type: "CAST_VOTE"; vote: Vote; }
    | { type: "ADVANCE_INPUT_PAGE"; }
    | { type: "ADVANCE_GAME"; }
    | { type: "REGRESS_GAME"; }

export type CommandError = {
    code: string;
    message: string;
};

export type CommandResult =
    | {
        type: "SUCCESS";
        events: GameEvent[];
    }
    | {
        type: "ERROR";
        error: CommandError;
    };
