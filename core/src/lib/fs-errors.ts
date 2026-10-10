function hasCode(error: unknown, code: string): boolean {
    return error instanceof Error && "code" in error && error.code === code;
}

export function isNotFound(error: unknown): boolean {
    return hasCode(error, "ENOENT");
}

export function isAlreadyExists(error: unknown): boolean {
    return hasCode(error, "EEXIST");
}
