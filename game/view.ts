// Views must be of the types specified in ../shared/model/game-state-view.ts. 

import type { GameState } from "../shared/model/game-state.js";
import type { ClientGameStateView } from "../shared/model/game-state-view.js";
import type { Actor } from "../shared/actor.js";

import { assertNever } from "../shared/assert-never.js";

export function getGameStateView(
    state: GameState,
    actor: Actor,
): ClientGameStateView {
    switch (actor.type) {
        case "HOST":
            return {
                actor: actor,

                players: state.players,
                host: state.host,

                phase: state.phase,
                currentRound: state.currentRound,

                currentOptions: state.rounds[state.currentRound].options,
                currentVotes: state.rounds[state.currentRound].votes,
            };

        case "PLAYER":
            return {
                actor: actor,
                
                players: state.players,
                host: state.host,

                phase: state.phase,
                currentRound: state.currentRound,

                currentOptions: state.rounds[state.currentRound].options,
                currentVote: state.rounds[state.currentRound].votes[actor.playerId] ?? null,
                gamePlayer: state.players[actor.playerId]
            };

        case "UNASSIGNED":
            return {
                actor: actor,

                players: state.players,
                host: state.host,

                phase: state.phase,
                currentRound: state.currentRound,
            };

        default:
            return assertNever(actor);
    }
}