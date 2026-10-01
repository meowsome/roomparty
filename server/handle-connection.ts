// Handles the lifecycle of a connection to the server, including receiving messages and sending updates.

import type { Connection } from "../shared/connection";
import type { Command } from "../shared/command";
import type { Actor } from "../shared/actor";

import { getGameStateView } from "../game/view";

import { applyActorEvent } from "./actor-reducer";
import { updateConnections, addConnection, removeConnection } from "./connections";

import {
    executeCommand,
    type Room,
} from "./room";

export function handleConnection(
    connection: Connection,
    room: Room,
) {
    // Each connection has an associated actor, which starts as unassigned and can become a host or player.
    let actor: Actor = {
        type: "UNASSIGNED",
    };

    addConnection(room, connection);

    // Send the initial game state to the new connection.
    sendView(
        connection,
        room,
        actor,
    );

    connection.receive((raw) => {
        actor = handleMessage(
            connection,
            room,
            actor,
            raw,
        );
    });

    connection.receiveClose(() => {
        removeConnection(
            connection,
            room,
            actor,
        );
    });
}

function handleMessage(
    connection: Connection,
    room: Room,
    actor: Actor,
    raw: object,
): Actor {
    // Command parsing and validation
    const command = raw as Command;
    if (command === null) {
        sendError(
            connection,
            "INVALID_COMMAND",
            "Invalid command.",
        );

        return actor;
    }

    // Execute the command and potentially update the game state.
    const result = executeCommand(
        room,
        actor,
        command,
    );

    if (result.type === "ERROR") {
        sendError(
            connection,
            result.error.code,
            result.error.message,
        );

        return actor;
    }

    // Potentially update the actor and the associated room's connections.
    for (const event of result.events) {
        actor = applyActorEvent(actor, event);
        updateConnections(room, connection, event);
    }

    broadcastState(room);

    return actor;
}

function sendView(
    connection: Connection,
    room: Room,
    actor: Actor,
) {
    // Provide the client with their view state as well as their actor identity.
    connection.send({
        type: "STATE",
        state: getGameStateView(
            room.game,
            actor,
        ),
        actor: actor
    });
}

function sendError(
    connection: Connection,
    code: string,
    message: string,
) {
    connection.send({
        type: "ERROR",
        error: {
            code,
            message,
        },
    });
}

function broadcastState(
    room: Room,
) {
    if (room.connections.host !== null) {
        sendView(
            room.connections.host,
            room,
            {
                type: "HOST",
            },
        );
    }

    for (const [playerId, connection] of room.connections.players) {
        sendView(
            connection,
            room,
            {
                type: "PLAYER",
                playerId: playerId,
            },
        );
    }

    for (const connection of room.connections.unassigned) {
        sendView(
            connection,
            room,
            {
                type: "UNASSIGNED",
            },
        );
    }
}