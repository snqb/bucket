import { Button } from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import { store } from "../store";

export const Clean = ({
  what,
  all = false,
}: {
  what: keyof typeof store;
  all?: boolean;
}) => {
  const where = useSyncedStore(store)[what];

  const hasDones = where.some((it) => it.progress === 100);

  console.log(hasDones, what);
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
            const doneIndex = where.findIndex((it) => it.progress === 100);
            console.log(doneIndex);
            if (doneIndex === -1) {
              return;
            }
            console.log("cleaning!");

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
