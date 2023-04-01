import { Skeleton, VStack } from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import { store } from "../store";

export const Empty = ({ what }: { what: keyof typeof store }) => {
  const where = useSyncedStore(store[what]);

  return (
    <>
      {where.length === 0 && (
        <VStack align="stretch">
          <Skeleton h="48px" />
        </VStack>
      )}
    </>
  );
};
