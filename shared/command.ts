// The various commands that can be sent to the server. These are handled in the `handleCommand` function in `game/rules.ts`.
// They generate events that are applied to the game state in `server/room.ts` using the `applyEvent` function.

export type Command =
    | {
        type: "BECOME";
        role: "HOST" 
    }
    | {
        type: "BECOME";
        role: "PLAYER";
        desiredName: string;
    }
    | {
        type: "DESTROY";
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