import type { Actor } from "../shared/actor";
import type { GameEvent } from "../shared/event";
import { getPlayerId } from "../shared/model/player";

export function applyActorEvent(
    actor: Actor,
    event: GameEvent,
): Actor {

    switch (event.type) {

        case "HOST_BECAME":
            return {
                type: "HOST",
            };

        case "PLAYER_BECAME":
            return {
                type: "PLAYER",
                playerId: getPlayerId(event.player.displayName),
            };

        case "HOST_DESTROYED":
            if (actor.type === "HOST") {
                return {
                    type: "UNASSIGNED",
                };
            }

            return actor;

        case "PLAYER_DESTROYED":
            if (
                actor.type === "PLAYER" &&
                actor.playerId === event.playerId
            ) {
                return {
                    type: "UNASSIGNED",
                };
            }

            return actor;

        default:
            return actor;
    }
}