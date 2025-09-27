import "dotenv/config";
import { defineConfig } from "drizzle-kit";

import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Config } from 'drizzle-kit';
// using './node_modules/wrangler' instead of 'wrangler' because it may resolve to 'wrangler.json'
import { unstable_readConfig } from './node_modules/wrangler';

function durableObjectNamespaceIdFromName(uniqueKey: string, name: string) {
  /**
   * In v3.2, miniflare uses durable object to implement D1 and hashes the local sqlite filename.
   *
   * See the following for more context:
   * https://github.com/cloudflare/workers-sdk/issues/4548 (understand the hash of the local D1 filename)
   * https://github.com/cloudflare/miniflare/releases/tag/v3.20230918.0
   *
   * This function is copied from these links
   */
  const key = crypto.createHash('sha256').update(uniqueKey).digest();
  const nameHmac = crypto.createHmac('sha256', key).update(name).digest().subarray(0, 16);
  const hmac = crypto.createHmac('sha256', key).update(nameHmac).digest().subarray(0, 16);
  return Buffer.concat([nameHmac, hmac]).toString('hex');
}

function getD1BindingInfo(binding?: string, { persistTo }: { persistTo?: string } = {}) {
  const { d1_databases, configPath } = unstable_readConfig({});
  if (d1_databases.length === 0) {
    throw new Error('No D1 binding exists in config');
  }
  if (d1_databases.length > 1 && !binding) {
    throw new Error("Argument 'binding' is required when more than 1 D1 bindings exist in config");
  }
  let bindingConfig: (typeof d1_databases)[0] | undefined;
  if (binding) {
    bindingConfig = d1_databases.find((d1) => d1.binding === binding);
    if (!bindingConfig) {
      throw new Error(`Could not find D1 binding '${binding}' in config`);
    }
  } else {
    bindingConfig = d1_databases[0];
  }

  const localDatabaseId = bindingConfig.preview_database_id ?? bindingConfig.database_id;

  if (!localDatabaseId) {
    throw new Error(`Neither 'preview_database_id' nor 'database_id' is set for D1 binding '${bindingConfig.binding}'`);
  }

  const wranglerConfigDir = configPath ? path.dirname(configPath) : undefined;
  const wranglerStateDir = persistTo ?? path.relative('.', path.join(wranglerConfigDir ?? '', '.wrangler/state/v3'));

  const uniqueKey = 'miniflare-D1DatabaseObject';
  const miniflarePath = `${wranglerStateDir}/d1/${uniqueKey}`;
  const hash = durableObjectNamespaceIdFromName(uniqueKey, localDatabaseId);
  const filename = path.join(miniflarePath, `${hash}.sqlite`);

  if (!existsSync(filename)) {
    throw new Error(`Could not find sqlite file [${filename}] for databaseId [${localDatabaseId}]`);
  }

  return {
    binding: bindingConfig.binding,
    databaseId: localDatabaseId,
    localSqliteFile: filename,
  };
}

const ENV_CF_D1_ACCOUNT_ID = 'ACCOUNT_ID' as const;
const ENV_CF_D1_API_TOKEN = 'DATABASE_TOKEN' as const;

const useRemoteDatabase = process.env.NODE_ENV === 'production';
const databaseBinding = "DATABASE";
const binding = getD1BindingInfo(databaseBinding);

console.log(`D1 Binding: ${binding.binding}`);
console.log(`Database Id: ${binding.databaseId}`);
if (useRemoteDatabase) {
  const missingEnvVars = [ENV_CF_D1_ACCOUNT_ID, ENV_CF_D1_API_TOKEN].filter((v) => !process.env[v]);

  console.log('Mode: remote (using remote Cloudflare D1 database)');

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variable${missingEnvVars.length > 1 ? 's' : ''}: ${missingEnvVars.join(', ')}.`);
  }
} else {
  console.log(`Mode: local (using local database found at ${binding.localSqliteFile})`);
}

export default defineConfig({
  out: './drizzle',
  schema: './app/db/schema.ts',
  dialect: 'sqlite',
    ...(useRemoteDatabase
    ? {
        driver: 'd1-http',
        dbCredentials: {
            databaseId: binding.databaseId,
            accountId: process.env[ENV_CF_D1_ACCOUNT_ID],
            token: process.env[ENV_CF_D1_API_TOKEN],
        },
        }
    : {
        dbCredentials: {
            url: `file:${binding.localSqliteFile}`,
        },
        }),
});
