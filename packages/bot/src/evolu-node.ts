/**
 * Headless Evolu client for Node.js.
 *
 * - With mnemonic: restores identity (syncs with web app)
 * - Without: fresh identity, prints mnemonic for you to copy
 */

import * as E from "@evolu/common";
import { createDbWorkerForPlatform } from "@evolu/common/local-first";
import { createBetterSqliteDriver } from "@evolu/nodejs";
import { Schema } from "@bucket/core";

const RELAY_URL = "wss://relay-production-1075.up.railway.app";

function makeEvoluDeps() {
  const createDbWorker = (_name: any) =>
    createDbWorkerForPlatform({
      console: E.createConsole(),
      createSqliteDriver: createBetterSqliteDriver,
      createWebSocket: E.createWebSocket,
      random: E.createRandom(),
      randomBytes: E.createRandomBytes(),
      time: E.createTime(),
    });

  return {
    console: E.createConsole(),
    createDbWorker,
    randomBytes: E.createRandomBytes(),
    reloadApp: () => {},
    time: E.createTime(),
  };
}

export async function createNodeEvolu(mnemonic?: string, name = "bucket-bot") {
  const evolu = E.createEvolu(makeEvoluDeps())(Schema, {
    name: E.SimpleName.orThrow(name),
    transports: [{ type: "WebSocket", url: RELAY_URL }],
  });

  evolu.subscribeError(() => {
    const error = evolu.getError();
    if (error) console.error("[evolu]", error);
  });

  if (mnemonic) {
    const m = E.Mnemonic.from(mnemonic);
    if (!m.ok) throw new Error("Invalid mnemonic");
    await evolu.restoreAppOwner(m.value, { reload: false });
    console.log("✅ Restored from mnemonic");
  } else {
    // Fresh — wait for auto-generated owner, print mnemonic
    const owner = await evolu.appOwner;
    console.log("\n🔑 NEW MNEMONIC (paste into web app Settings → Restore):");
    console.log(`\n  ${owner?.mnemonic}\n`);
  }

  return evolu;
}
