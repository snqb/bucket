import { Button } from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import * as R from "ramda";
import { store } from "../store";

export const Clean = ({
  what,
  all = false,
}: {
  what: keyof typeof store;
  all?: boolean;
}) => {
  const where = useSyncedStore(store[what]);

  const hasDones = where.some((it) => it.progress === 100);

  if (!hasDones) return null;

  return (
    <Button
      display="inline"
      opacity={0.5}
      size="sm"
      onClick={() => {
        const cleanup = () => {
          if (all) {
            where.splice(0, where.length);
          } else {
            const doneIndex = R.findIndex(R.propEq("progress", 100))(where);
            if (doneIndex === -1) {
              return;
            }

            // we recursively delete them because syncedstore doesn't support `filter`, as we have to mutate
            where.splice(doneIndex, 1);
            cleanup();
          }
        };

        cleanup();
      }}
    >
      🗑️
    </Button>
  );
};
