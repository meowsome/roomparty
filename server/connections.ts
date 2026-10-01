import { Connection } from "../shared/connection";
import { GameEvent } from "../shared/event";
import { getPlayerId } from "../shared/model/player";
import { Room } from "./room";


// Handle room connections based on the game events.
export function updateConnections(
    room: Room,
    connection: Connection,
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