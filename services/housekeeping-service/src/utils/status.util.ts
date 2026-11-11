export function isValidCleaningTransition(from: string, to: string): boolean {
  const transitions: Record<string, string[]> = {
    DIRTY: ["IN_PROGRESS", "CLEAN"],
    IN_PROGRESS: ["CLEAN", "DIRTY"],
    CLEAN: ["INSPECTED", "DIRTY"],
    INSPECTED: ["DIRTY"],
  };
  return transitions[from]?.includes(to) ?? false;
}

