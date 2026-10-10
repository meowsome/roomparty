export type Player = {
    displayName: string;
    inputPhase: number; // This should not go here because players get this for every single other player
};

export function getPlayerId(name: string): string {
    return name.trim().toLowerCase();
}