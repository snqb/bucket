/**
 * Headless Evolu client for Node.js.
 *
 * Creates an in-process Evolu instance (no Web Workers) using better-sqlite3.
 * Syncs via the same relay as the web app. Restore from mnemonic to share data.
 */

import * as E from "@evolu/common";
import { createDbWorkerForPlatform } from "@evolu/common/local-first";
import { createBetterSqliteDriver } from "@evolu/nodejs";
import { Schema } from "@bucket/core";

const RELAY_URL = "wss://relay-production-1075.up.railway.app";

/** Create a headless Evolu instance for Node.js, restored from mnemonic */
export async function createNodeEvolu(mnemonic: string) {
  const mnemonicResult = E.Mnemonic.from(mnemonic);
  if (!mnemonicResult.ok) {
    throw new Error(`Invalid mnemonic`);
  }

  // In-process DbWorker using better-sqlite3 (no web workers)
  const createDbWorker: E.CreateEvolu extends (deps: infer D) => any
    ? D extends { createDbWorker: infer F }
      ? F
      : never
    : never = (_name: any) =>
    createDbWorkerForPlatform({
      console: E.createConsole(),
      createSqliteDriver: createBetterSqliteDriver,
      createWebSocket: E.createWebSocket,
      random: E.createRandom(),
      randomBytes: E.createRandomBytes(),
      time: E.createTime(),
    });

  const evolu = E.createEvolu({
    console: E.createConsole(),
    createDbWorker,
    randomBytes: E.createRandomBytes(),
    reloadApp: () => {}, // no-op
    time: E.createTime(),
  })(Schema, {
    name: E.SimpleName.orThrow("bucket-bot"),
    transports: [{ type: "WebSocket", url: RELAY_URL }],
  });

  // Subscribe to errors
  evolu.subscribeError(() => {
    const error = evolu.getError();
    if (error) console.error("[evolu]", error);
  });

  // Restore from mnemonic → establishes same identity as web app
  await evolu.restoreAppOwner(mnemonicResult.value, { reload: false });
  console.log("✅ Evolu restored from mnemonic");

  return evolu;
}
