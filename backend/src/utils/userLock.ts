const chains = new Map<string, Promise<unknown>>();

/**
 * Runs tasks that share a key strictly one after another (in-process).
 * The intelligence recalculations replace a user's records with delete-then-insert, so two
 * overlapping runs for the same user would otherwise leave duplicate documents behind.
 */
export function withUserLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(task);
  const tail = run.catch(() => undefined);

  chains.set(key, tail);
  void tail.then(() => {
    if (chains.get(key) === tail) chains.delete(key);
  });

  return run;
}

export default withUserLock;
