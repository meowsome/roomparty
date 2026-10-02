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
                actor: actor,

                revision: state.revision,
                host: state.host,
                players: state.players,

                phase: state.phase,
                currentRound: state.currentRound,

                currentOptions: state.rounds[state.currentRound].options,
                currentVotes: state.rounds[state.currentRound].votes,
            };

        case "PLAYER":
            return {
                actor: actor,

                revision: state.revision,
                host: state.host,
                players: state.players,

                phase: state.phase,
                currentRound: state.currentRound,

                currentOptions: state.rounds[state.currentRound].options,
                currentVote: state.rounds[state.currentRound].votes[actor.playerId] ?? null,
            };

        case "UNASSIGNED":
            return {
                actor: actor,

                revision: state.revision,
                host: state.host,
                players: state.players,

                phase: state.phase,
                currentRound: state.currentRound,
            };

        default:
            return assertNever(actor);
    }
}