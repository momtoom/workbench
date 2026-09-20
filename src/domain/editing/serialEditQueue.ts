export type SerialEditQueue = {
  enqueue: <T>(
    operation: () => Promise<T> | T,
    options?: { skipBeforeOperation?: boolean },
  ) => Promise<T>;
  idle: () => Promise<void>;
};

export function createSerialEditQueue(
  beforeOperation?: () => Promise<void> | void,
): SerialEditQueue {
  let tail: Promise<unknown> = Promise.resolve();

  function enqueue<T>(
    operation: () => Promise<T> | T,
    options: { skipBeforeOperation?: boolean } = {},
  ): Promise<T> {
    const runOperation = async () => {
      if (!options.skipBeforeOperation) await beforeOperation?.();
      return operation();
    };
    const run = tail.then(runOperation, runOperation);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  return {
    enqueue,
    idle: () => tail.then(() => undefined),
  };
}
