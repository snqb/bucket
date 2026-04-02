import * as E from "@evolu/common";
import { createUseEvolu, EvoluProvider } from "@evolu/react";
import { evoluReactWebDeps, localAuth } from "@evolu/react-web";
import { Schema } from "@bucket/core";

const service = "bucket-v2";

// Auth: passkey-based, or guest
const ownerIds = await localAuth.getProfiles({ service });
const authResult = await localAuth.getOwner({ service });

export const evolu = E.createEvolu(evoluReactWebDeps)(Schema, {
  name: E.SimpleName.orThrow(
    `${service}-${authResult?.owner?.id ?? "guest"}`,
  ),
  ...(authResult?.owner
    ? {
        encryptionKey: authResult.owner.encryptionKey,
        externalAppOwner: authResult.owner,
      }
    : {}),
  // Self-hosted relay (uncomment when deployed):
  // transports: [{ type: "WebSocket", url: "wss://bucket-sync.esen.works" }],
} as E.EvoluConfig);

export const useEvolu = createUseEvolu(evolu);
export { EvoluProvider, ownerIds, authResult, localAuth, service };

// Subscribe to errors
evolu.subscribeError(() => {
  const error = evolu.getError();
  if (error) console.error("Evolu error:", error);
});
