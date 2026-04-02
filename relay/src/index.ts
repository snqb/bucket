import { createConsole } from "@evolu/common";
import { createNodeJsRelay } from "@evolu/nodejs";
import { mkdirSync } from "fs";

mkdirSync("data", { recursive: true });
process.chdir("data");

const port = Number(process.env.PORT) || 4000;

const relay = await createNodeJsRelay({
  console: createConsole(),
})({
  port,
  enableLogging: false,
  isOwnerWithinQuota: (_ownerId, requiredBytes) => {
    const maxBytes = 10 * 1024 * 1024; // 10MB per owner
    return requiredBytes <= maxBytes;
  },
});

if (relay.ok) {
  console.log(`🪣 Bucket relay on :${port}`);
  process.once("SIGINT", relay.value[Symbol.dispose]);
  process.once("SIGTERM", relay.value[Symbol.dispose]);
} else {
  console.error(relay.error);
  process.exit(1);
}
