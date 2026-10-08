export type Player = {
    displayName: string;
    inputPhase: number;
};

export function getPlayerId(name: string): string {
    return name.trim().toLowerCase();
}