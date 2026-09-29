// This file contains the types and functions for the game room. This is where the "command" -> "event" -> "update state" flow occurs. 

import type { WebSocket } from "ws";

import type { Command } from "../game/command";
import type { GameState } from "../game/state";
import type { CommandResult } from "../game/rules";

import {
    handleCommand,
    type Actor,
    type CommandError,
} from "../game/rules";
import { applyEvent } from "../game/reducer";

export type Room = {
    game: GameState;

    connections: {
        host: WebSocket | null;
        players: Map<string, WebSocket>;
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