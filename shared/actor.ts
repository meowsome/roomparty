// The various actors that can send commands to the server. These are used in the `handleCommand`
// function in `game/rules.ts` to determine what commands are valid for each actor. 

export type Actor =
    | { type: "HOST" }
    | { type: "PLAYER"; playerId: string;}
    | { type: "UNASSIGNED";};
