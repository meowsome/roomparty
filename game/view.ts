// Views must be of the types specified in ../shared/model/game-state-view.ts. 

import type { GameState } from "../shared/model/game-state";
import type { ClientGameStateView } from "../shared/model/game-state-view";
import type { Actor } from "../shared/actor";

import { assertNever } from "../shared/assert-never";

export function getGameStateView(
    state: GameState,
    actor: Actor,
): ClientGameStateView {
    switch (actor.type) {
        case "HOST":
            return {
                revision: state.revision,
                host: state.host,
                counter: state.counter,
                players: state.players,
            };

        case "PLAYER":
            return {
                revision: state.revision,
                host: state.host,
                counter: state.counter,
                players: state.players,
            };

        case "UNASSIGNED":
            return {
                revision: state.revision,
                host: state.host,
                players: state.players,
            };

        default:
            return assertNever(actor);
    }
}