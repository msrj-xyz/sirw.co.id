import Queue from 'bull';
import { REDIS_URL } from '../config';

// In test environment avoid connecting to a real Redis/Bull instance.
// Provide a minimal stub implementing the methods used by the worker and routes.
class QueueStub {
	private handlers: Array<(job: { id: string; data: Record<string, unknown>; progress?: (n?: number) => void | Promise<void> }) => Promise<unknown> | unknown> = [];
		async add(data: Record<string, unknown>) {
			const id = `${Date.now()}`;
			const job = { id, data, progress: async () => { /* noop */ } };
		// if a handler was registered via process(), invoke it
		if (this.handlers.length > 0) {
			try {
				const handler = this.handlers[0];
				// call handler asynchronously but wait for completion before returning
				const result = await handler(job);
				return { id, result };
			} catch (e) {
				return { id, error: String(e) };
			}
		}
		return { id };
	}
		process(handler: (job: { id: string; data: Record<string, unknown>; progress?: (n?: number) => void | Promise<void> }) => Promise<unknown> | unknown) {
			this.handlers.push(handler);
			return undefined;
		}
	on() { /* noop */ }
	async close() { /* noop */ }
}

// use a single queue for residents import
export const residentsImportQueue = (process.env.NODE_ENV === 'test')
	? new QueueStub()
	: REDIS_URL
		? new Queue('residents:import', REDIS_URL)
		: new Queue('residents:import');

export default residentsImportQueue;
