export const DEFAULT_BACKOFF_MS = [
    1_000,
    5_000,
    30_000,
    300_000,
    1_800_000,
    1_800_000,
] as const;

export function getBackoffDelayMs(
    attempt: number,
    schedule: readonly number[] = DEFAULT_BACKOFF_MS,
): number {
    if (attempt <= 0) {
        return 0;
    }

    const index = Math.min(attempt - 1, schedule.length - 1);
    return schedule.at(index) ?? schedule.at(-1) ?? 0;
}
