// Helper function to prevent TypeScript from compiling code that doesn't handle all possible cases in a switch statement.
export function assertNever(value: never): never {
    throw new Error("Unexpected value");
}