/// <reference types="@cloudflare/workers-types" />
import { drizzle, DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';
import { DurableObject } from 'cloudflare:workers'
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import migrations from '../../drizzle/migrations';

export class TripDurableObject extends DurableObject<Env> {
  storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase<any>;


	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		
		// migrate the database
		ctx.blockConcurrencyWhile(async () => {
			await this._migrate();
		})
	}
	
	async _migrate() {
		await migrate(this.db, migrations);
	}
}