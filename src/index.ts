import {Service} from '@cloudflare/workers-types';
import { WorkerEntrypoint } from 'cloudflare:workers';

type NotificationsRegisteredRow = {
	item_key_index: string
};

interface DoctorNotifierService extends WorkerEntrypoint {
	checkAndNotify: (itemKeyIndex: string) => undefined;
}

interface Env {
	DB: D1Database;
	SERVICE: Service<DoctorNotifierService>;
}

export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		console.log("Triggered periodic update");
		const itemKeyIndexes = await getAllRegisteredItemKeyIndexes(env);
		itemKeyIndexes.forEach(itemKeyIndex => {
			console.log(`Triggering update for itemKeyIndex ${itemKeyIndex}`);
			env.SERVICE.checkAndNotify(itemKeyIndex);
		});
	}
};

async function getAllRegisteredItemKeyIndexes(env: Env): Promise<string[]> {
	try {
		const stmt = env.DB.prepare("SELECT DISTINCT item_key_index FROM notifications_registered");
		const { results, success } = await stmt.all<NotificationsRegisteredRow>();
		if (!success) {
			console.log("Unknown error executing SQL query in getAllRegisteredItemKeyIndexes");
			return [];
		}
		return results.map(result => result.item_key_index)
	} catch (e) {
		if (e instanceof Error)
			console.error(`Error executing SQL query in getAllRegisteredItemKeyIndexes - ${e.message}`);
		return [];
	}
}