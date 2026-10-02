import type { Command } from "./command";
import type { ClientGameStateView } from "./model/game-state-view";

// Commands sent from the client to the server.
export type ClientMessage =
    | Command;

// Messages sent from the server to the client.
export type ServerMessage =
    | {
        type: "STATE";
        state: ClientGameStateView;
    }
    | {
        type: "ERROR";
        error: {
            code: string;
            message: string;
        };
    };