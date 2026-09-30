import type { WebSocket } from "ws";

import type { Command } from "../shared/command";
import type { Actor } from "../shared/actor";

import type { GameEvent } from "../game/event";
import { getGameStateView } from "../game/view";
import {
    executeCommand,
    type Room,
} from "./room";

export function handleConnection(
    socket: WebSocket,
    room: Room,
) {
    let actor: Actor = {
        type: "UNASSIGNED",
    };

    room.connections.unassigned.add(socket);

    // Send the initial game state to the new connection.
    sendView(
        socket,
        room,
        actor,
    );

    socket.on("message", raw => {
        actor = handleMessage(
            socket,
            room,
            actor,
            raw,
        );
    });

    socket.on("close", () => {
        removeConnection(
            socket,
            room,
            actor,
        );
    });
}

function handleMessage(
    socket: WebSocket,
    room: Room,
    actor: Actor,
    raw: WebSocket.RawData
): Actor {
    // Command parsing and validation
    const command = parseCommand(raw);
    if (command === null) {
        sendError(
            socket,
            "INVALID_COMMAND",
            "Invalid command.",
        );

        return actor;
    }

    // Check if the command can be executed by this connection.
    if (!canExecute(socket,room,command)) {
        return actor;
    }

    // If so, execute the command and update the game state.
    const result = executeCommand(
        room,
        actor,
        command,
    );

    if (result.type === "ERROR") {
        sendError(
            socket,
            result.error.code,
            result.error.message,
        );

        return actor;
    }

    // Handle special events that affect the connection identity.
    const newActor = handleEvents(
        socket,
        room,
        actor,
        result.events,
    );

    broadcastState(room);

    return newActor;
}

function canExecute(
    socket: WebSocket,
    room: Room,
    command: Command,
): boolean {
    if (command.type === "BECOME" && command.role === "PLAYER") {
        const name = command.desiredName
            .trim()
            .toLowerCase();

        const existingSocket = room.connections.players.get(name);

        if (existingSocket !== undefined && existingSocket !== socket) {
            sendError(
                socket,
                "PLAYER_ALREADY_CONNECTED",
                "That player is already connected.",
            );

            return false;
        }
    }

    return true;
}

function handleEvents(
    socket: WebSocket,
    room: Room,
    actor: Actor,
    events: GameEvent[],
): Actor {
    for (const event of events) {
        switch (event.type) {

            // Handle special event types that affect the connection identity.
            case "HOST_BECAME":
                room.connections.unassigned.delete(socket);
                actor = {
                    type: "HOST",
                };

                room.connections.host = socket;
                break;

            case "PLAYER_BECAME":
                room.connections.unassigned.delete(socket);

                actor = {
                    type: "PLAYER",
                    name: event.player.name,
                };

                room.connections.players.set(
                    event.player.name
                        .trim()
                        .toLowerCase(),
                    socket,
                );
                break;

            case "HOST_DESTROYED":
                room.connections.host = null;
                actor = {
                    type: "UNASSIGNED",
                };
                room.connections.unassigned.add(socket);
                break;

            case "PLAYER_DESTROYED":
                room.connections.players.delete(
                    event.playerName
                        .trim()
                        .toLowerCase(),
                );
                actor = {
                    type: "UNASSIGNED",
                };
                room.connections.unassigned.add(socket);
                break;

        }
    }

    return actor;
}

function sendView(
    socket: WebSocket,
    room: Room,
    actor: Actor,
) {
    // Provide the client with their view state as well as their actor identity.
    socket.send(JSON.stringify({
        type: "STATE",
        state: getGameStateView(
            room.game,
            actor,
        ),
        actor: actor
    }));
}

function sendError(
    socket: WebSocket,
    code: string,
    message: string,
) {
    socket.send(JSON.stringify({
        type: "ERROR",
        error: {
            code,
            message,
        },
    }));
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

    for (const [name, socket] of room.connections.players) {
        sendView(
            socket,
            room,
            {
                type: "PLAYER",
                name: name,
            },
        );
    }

    for (const socket of room.connections.unassigned) {
        sendView(
            socket,
            room,
            {
                type: "UNASSIGNED",
            },
        );
    }
}

function removeConnection(
    socket: WebSocket,
    room: Room,
    actor: Actor,
) {
    switch (actor.type) {
        case "HOST":
            if (room.connections.host === socket) {
                room.connections.host = null;
            }
            break;

        case "PLAYER": {
            const key = actor.name
                .trim()
                .toLowerCase();

            if (room.connections.players.get(key) === socket) {
                room.connections.players.delete(key);
            }

            break;
        }

        case "UNASSIGNED":
            room.connections.unassigned.delete(socket);
            break;
    }
}

function parseCommand(
    raw: WebSocket.RawData,
): Command | null {
    try {
        const value = JSON.parse(
            raw.toString(),
        );

        return value as Command;
    } catch {
        return null;
    }
}