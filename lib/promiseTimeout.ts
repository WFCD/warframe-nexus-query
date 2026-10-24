/**
 * Copied from https://italonascimento.github.io/applying-a-timeout-to-your-promises
 * Apply a timeout to your promise
 * @param ms - Milliseconds to time out after
 * @param promise - Promise to time out
 * @returns Pending promise that works or rejects with an error
 */
export default function promiseTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  const timeout = new Promise<T>((_resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timed out in ${ms}ms.`));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}
