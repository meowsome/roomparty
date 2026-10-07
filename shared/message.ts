import type { Command } from "./command.js";
import type { ClientGameStateView } from "./model/game-state-view.js";

// Commands sent from the client to the server.
export type ClientMessage =
    | Command;

// Messages sent from the server to the client.
export type ServerMessage =
    | {
        type: "VIEW";
        revision: number;
        view: ClientGameStateView;
    }
    | {
        type: "ERROR";
        error: {
            code: string;
            message: string;
        };
    };