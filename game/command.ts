// The various commands that can be sent to the server. These are handled in the `handleCommand` function in `game/rules.ts`.
// They generate events that are applied to the game state in `server/room.ts` using the `applyEvent` function.

export type Command =
    | {
        type: "BECOME_HOST";
    }
    | {
        type: "BECOME_PLAYER";
        desiredName: string;
    }
    | {
        type: "DESTROY_PLAYER";
    }
    | {
        type: "INCREMENT";
    }
    | {
        type: "DECREMENT";
    }
    | {
        type: "RESET_COUNTER";
    };