const WORKBENCH_HOST_POINTER_GESTURE_CLASS = 'wb-host-pointer-gesture';

const activeBodyClassCounts = new Map<string, number>();

export function beginWorkbenchHostPointerGesture(...extraClassNames: string[]): () => void {
  const classNames = [WORKBENCH_HOST_POINTER_GESTURE_CLASS, ...extraClassNames]
    .filter((className): className is string => Boolean(className));
  let active = true;

  for (const className of classNames) {
    updateWorkbenchHostPointerGestureClass(className, 1);
  }

  return () => {
    if (!active) return;
    active = false;
    for (const className of classNames) {
      updateWorkbenchHostPointerGestureClass(className, -1);
    }
  };
}

function updateWorkbenchHostPointerGestureClass(className: string, delta: 1 | -1) {
  const nextCount = Math.max(0, (activeBodyClassCounts.get(className) ?? 0) + delta);
  if (nextCount === 0) {
    activeBodyClassCounts.delete(className);
    document.body.classList.remove(className);
    return;
  }
  activeBodyClassCounts.set(className, nextCount);
  document.body.classList.add(className);
}
