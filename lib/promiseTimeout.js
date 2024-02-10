/**
 * Copied from https://italonascimento.github.io/applying-a-timeout-to-your-promises
 * Apply a timeout to your promise
 * @param  {number} ms        Milliseconds to time out after
 * @param  {Promise} promise  Promise to time out
 * @returns {Promise}          Pending promise that works or rejects with an error
 */
export default (ms, promise) => {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timed out in ${ms}ms.`));
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
};
