import ReloadPrompt from "./ReloadPrompt";

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import MagicGrid from "magic-grid";
import { Suspense, useEffect } from "react";
import Screen from "./Screen";
import { Button } from "./components/ui/button";

// Create a client
const queryClient = new QueryClient();

import PocketBase from "pocketbase";

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);
pb.collection("users").authWithPassword("gg@gg.com", "TQVD9V4kwYhSoUN");

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <Widest />
      </Suspense>
      <ReloadPrompt />
    </QueryClientProvider>
  );
}

console.log(pb.authStore.model);

const Widest = () => {
  const client = useQueryClient();
  const { data: values } = useSuspenseQuery({
    queryKey: ["screens"],
    queryFn: async () => {
      const screens = await pb.collection("screens").getFullList({
        sort: "created",
      });
      return screens;
    },
  });

  const addScreen = useMutation({
    mutationFn: async (title: string) => {
      const screen = await pb
        .collection("screens")
        .create({ title, author: [pb.authStore.model!.id] });
      return screen;
    },
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: ["screens"],
      });
    },
  });

  useEffect(() => {
    if (values.length !== 0) {
      let magicGrid = new MagicGrid({
        container: "#grid", // Required. Can be a class, id, or an HTMLElement.
        items: values.length, // For a grid with 20 items. Required for dynamic content.
        animate: true, // Optional.
        maxColumns: 5,
      });

      magicGrid.listen();
    }
  }, [values]);

  const confirmAdd = () => {
    const name = prompt("What is the name of the new screen?");
    if (name) {
      addScreen.mutate(name);
    }
  };

  return (
    <div className="flex flex-col">
      <Button onClick={confirmAdd}>+</Button>
      <div id="grid" className="min-w-[100vw]">
        {values.map((item, index) => {
          return (
            <Screen
              id={item.id}
              className="min-h-[40vh] p-4 max-md:w-full md:min-h-[40ch]"
              x={0}
              y={0}
              name={item.title}
              collectionId={item.id}
              drag={false}
              onClick={(e) =>
                e.currentTarget.scrollIntoView({
                  block: "center",
                  inline: "center",
                  behavior: "smooth",
                })
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default App;
