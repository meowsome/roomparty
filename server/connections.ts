// Manages the connections in a room, including the host, players, and unassigned connections.

import { ServerConnection } from "../shared/connection";
import { GameEvent } from "../shared/event";
import { getPlayerId } from "../shared/model/player";
import type { Actor } from "../shared/actor";

import { Room } from "../game/room";


export type Connections = {
    host: ServerConnection | null;
    players: Map<string, ServerConnection>;
    unassigned: Set<ServerConnection>;
};

// Handle room connections based on the game events.
export function updateConnections(
    room: Room,
    connection: ServerConnection,
    event: GameEvent,
) {
    switch (event.type) {

        case "HOST_BECAME":
            room.connections.unassigned.delete(connection);
            room.connections.host = connection;
            break;

        case "PLAYER_BECAME": {
            const playerId = getPlayerId(
                event.player.displayName,
            );

            room.connections.unassigned.delete(connection);
            room.connections.players.set(
                playerId,
                connection,
            );
            break;
        }

        case "HOST_DESTROYED":
            if (room.connections.host === connection) {
                room.connections.host = null;
            }

            room.connections.unassigned.add(connection);
            break;

        case "PLAYER_DESTROYED": {
            if (
                room.connections.players.get(event.playerId) === connection
            ) {
                room.connections.players.delete(event.playerId);
            }

            room.connections.unassigned.add(connection);
            break;
        }
    }
}

export function addConnection(room: Room, connection: ServerConnection): void {
    room.connections.unassigned.add(connection);
}

export function removeConnection(
    connection: ServerConnection,
    room: Room,
    actor: Actor,
) {
    switch (actor.type) {
        case "HOST":
            if (room.connections.host === connection) {
                room.connections.host = null;
            }
            break;

        case "PLAYER": {

            if (room.connections.players.get(actor.playerId) === connection) {
                room.connections.players.delete(actor.playerId);
            }

            break;
        }

        case "UNASSIGNED":
            room.connections.unassigned.delete(connection);
            break;
    }
}

export function isPlayerConnected(room: Room, playerId: string): boolean {
    return room.connections.players.has(playerId);
}