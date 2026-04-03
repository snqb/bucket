/**
 * Headless Evolu client for Node.js.
 *
 * Creates Evolu with owner derived directly from mnemonic — no reset needed.
 * This avoids the evolu_message_quarantine bug in restoreAppOwner.
 */

import * as E from "@evolu/common";
import {
  createDbWorkerForPlatform,
  type AppOwner,
} from "@evolu/common/local-first";
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

/** Derive AppOwner from mnemonic without going through restoreAppOwner (which has a quarantine table bug) */
function ownerFromMnemonic(mnemonic: string): AppOwner {
  const m = E.Mnemonic.from(mnemonic);
  if (!m.ok) throw new Error("Invalid mnemonic");
  // @ts-ignore — accessing internal but stable API
  const secret = E.mnemonicToOwnerSecret(m.value);
  // @ts-ignore
  return E.createAppOwner(secret);
}

export async function createNodeEvolu(mnemonic?: string, name = "bucket-bot") {
  const owner = mnemonic ? ownerFromMnemonic(mnemonic) : undefined;

  const evolu = E.createEvolu(makeEvoluDeps())(Schema, {
    name: E.SimpleName.orThrow(name),
    transports: [{ type: "WebSocket", url: RELAY_URL }],
    maxDrift: 60 * 60 * 1000, // 1 hour — relay may have stale timestamps from test runs
    ...(owner
      ? {
          encryptionKey: owner.encryptionKey,
          externalAppOwner: owner,
        }
      : {}),
  } as E.EvoluConfig);

  evolu.subscribeError(() => {
    const error = evolu.getError();
    if (error) console.error("[evolu]", error);
  });

  if (!mnemonic) {
    const o = await evolu.appOwner;
    console.log("\n🔑 NEW MNEMONIC (paste into web app Settings → Restore):");
    console.log(`\n  ${o?.mnemonic}\n`);
  } else {
    console.log("✅ Evolu initialized with mnemonic");
  }

  return evolu;
}
