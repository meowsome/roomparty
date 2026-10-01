// This file contains the types and functions for the game room. 
// The room is conceptually a "game server" that manages the game state and the connections to the clients.
// This is where the "command" -> "event" -> "update state" flow occurs. 

import type { Command } from "../shared/command";
import type { Actor } from "../shared/actor";
import type { GameState } from "../shared/state";
import type { CommandResult, CommandError } from "../shared/command";
import type { Connection } from "../shared/connection";

import { applyEvent } from "../game/reducer";
import { handleCommand } from "../game/rules";

export type Room = {
    game: GameState;

    connections: {
        host: Connection | null;
        players: Map<string, Connection>;
        unassigned: Set<Connection>;
    };
};

export function createRoom(): Room {
    return {
        game: {
            counter: 0,
            host: false,
            players: {},
        },

        connections: {
            host: null,
            players: new Map(),
            unassigned: new Set(),
        },
    };
}

export function executeCommand(
    room: Room,       // The game room that contains the current game state and connections.
    actor: Actor,     // The identity of the websocket connection that sent the command.
    command: Command, // The requested command to execute.
): CommandResult {

    // Determine the events that result from the command, 
    // or an error if the command is invalid.
    const result = handleCommand(
        room.game,
        actor,
        command,
    );

    if (result.type === "ERROR") {
        return result;
    }

    // Otherwise, apply the events to the game state.
    for (const event of result.events) {
        room.game = applyEvent(
            room.game,
            event,
        );
    }

    return result;
}