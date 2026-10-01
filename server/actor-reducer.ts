// This is the single function that mutates the actor in a given connection. It takes the current actor and an event, and returns the new actor state.
// It does not contain any validation logic. It is a simple pure function that applies the event to the actor.

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