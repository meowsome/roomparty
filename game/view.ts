// This manages the view of the game state for each actor. 

import type { Actor } from "../shared/actor";
import type { GameState } from "../shared/state";

export function getGameStateView(
    state: GameState,
    actor: Actor,
) {
    switch (actor.type) {
        case "HOST":
            // Host can see full game state
            return state;

        case "PLAYER":
            return {
                host: state.host,
                counter: state.counter,
                players: state.players,
            };

        case "UNASSIGNED":
            return {
                host: state.host,
                players: state.players,
            };
    }
}