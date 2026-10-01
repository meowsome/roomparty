export type Player = {
    displayName: string;
};

export function getPlayerId(name: string): string {
    return name.trim().toLowerCase();
}