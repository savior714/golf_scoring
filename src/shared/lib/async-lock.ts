/**
 * @file src/shared/lib/async-lock.ts
 * @description Simple async lock (mutex) for serializing operations.
 * - Used to prevent Race Conditions in "Read-Merge-Write" storage patterns.
 */

export class AsyncLock {
    private promise: Promise<void> = Promise.resolve();

    /**
     * Executes the provided task within the lock (serialized).
     * @param task Function to execute
     * @returns The result of the task
     */
    async run<T>(task: () => Promise<T>): Promise<T> {
        // Enqueue the task behind the current promise chain
        const currentPromise = this.promise;
        
        let release: () => void;
        const nextPromise = new Promise<void>((resolve) => {
            release = resolve;
        });
        
        // Atomically replace the lock's tip with the next promise
        this.promise = nextPromise;

        try {
            // Wait for all previous tasks to finish
            await currentPromise;
            // Execute the current task and return its result
            return await task();
        } finally {
            // Unblock the next task in the queue
            release!();
        }
    }
}
