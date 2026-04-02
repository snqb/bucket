/**
 * Headless Evolu client for Node.js.
 *
 * Creates an in-process Evolu instance (no Web Workers) using better-sqlite3.
 * Syncs via the same relay as the web app. Restore from mnemonic to share data.
 */

import * as E from "@evolu/common";
import {
  createDbWorkerForPlatform,
  type EvoluDeps,
} from "@evolu/common/local-first";
import { createBetterSqliteDriver } from "@evolu/nodejs";
import { Schema } from "@bucket/core";

const RELAY_URL = "wss://relay-production-1075.up.railway.app";

/** Create a headless Evolu instance for Node.js */
export function createNodeEvolu(mnemonic: string) {
  // Validate mnemonic
  const mnemonicResult = E.Mnemonic.from(mnemonic);
  if (!mnemonicResult.ok) {
    throw new Error(`Invalid mnemonic: ${JSON.stringify(mnemonicResult.error)}`);
  }

  // In-process DbWorker — no web workers needed
  const createDbWorker: EvoluDeps["createDbWorker"] = (_name) =>
    createDbWorkerForPlatform({
      console: E.createConsole(),
      createSqliteDriver: createBetterSqliteDriver,
      createWebSocket: E.createWebSocket, // Node 22 has globalThis.WebSocket
      random: E.createRandom(),
      randomBytes: E.createRandomBytes(),
      time: E.createTime(),
    });

  const deps: EvoluDeps = {
    console: E.createConsole(),
    createDbWorker,
    randomBytes: E.createRandomBytes(),
    reloadApp: () => {}, // no-op in Node.js
    time: E.createTime(),
  };

  const evolu = E.createEvolu(deps)(Schema, {
    name: E.SimpleName.orThrow("bucket-bot"),
    transports: [{ type: "WebSocket", url: RELAY_URL }],
  });

  // Restore from mnemonic (establishes same identity as web app)
  const ready = evolu.restoreAppOwner(mnemonicResult.value, { reload: false });

  return { evolu, ready };
}
