export type WorkbenchOpenDesignTargetDropPosition = 'before' | 'after';

export function reorderWorkbenchOpenDesignTargetKeys(
  value: unknown,
  draggedKey: string,
  targetKey: string,
  position: WorkbenchOpenDesignTargetDropPosition,
): string[] {
  const targetKeys = normalizeOpenDesignTargetKeys(value);
  if (draggedKey === targetKey) return targetKeys;
  if (!targetKeys.includes(draggedKey) || !targetKeys.includes(targetKey)) return targetKeys;

  const reorderedKeys = targetKeys.filter((key) => key !== draggedKey);
  const targetIndex = reorderedKeys.indexOf(targetKey);
  if (targetIndex < 0) return targetKeys;
  reorderedKeys.splice(position === 'before' ? targetIndex : targetIndex + 1, 0, draggedKey);
  return reorderedKeys;
}

function normalizeOpenDesignTargetKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    if (typeof entry !== 'string') return [];
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) return [];
    seen.add(trimmed);
    return [trimmed];
  });
}
