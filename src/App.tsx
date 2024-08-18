import ReloadPrompt from "./ReloadPrompt";

import { motion } from "framer-motion";
import Screen from "./Screen";
import { Button } from "./components/ui/button";
import { bucketDB, db } from "./store";
import MagicGrid from "magic-grid";
import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";

function App() {
  return (
    <>
      <Bucket />
      <ReloadPrompt />
    </>
  );
}

const Bucket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lists = useLiveQuery(() => bucketDB.todoLists.toArray());

  useEffect(() => {
    if (lists) {
      const magicGrid = new MagicGrid({
        container: "#bucket-app", // Required. Can be a class, id, or an HTMLElement.
        items: lists?.length, // For a grid with 20 items. Required for dynamic content.
        animate: true, // Optional.
        useMin: true,
        useTransform: true,
        maxColumns: 4,
      });

      magicGrid.listen();
      magicGrid.positionItems();
    }
  }, [lists?.length]);

  return (
    <div ref={containerRef} className="w-screen">
      <Button
        onClick={() => {
          const name = prompt("Enter the name of the new todo list");
          if (name) {
            bucketDB.todoLists.add({ title: name });
          }
        }}
        className=""
      >
        +
      </Button>
      <motion.div id="bucket-app">
        {lists?.map((it) => (
          <Screen
            className="min-h-48 min-w-[42ch] border border-gray-800 p-2 max-md:w-full"
            key={it.id}
            list={it}
          />
        ))}
        <Button
          variant="ghost"
          size="lg"
          className="fixed bottom-0 right-0 p-4 text-xs text-white"
        >
          🏠
        </Button>
      </motion.div>
    </div>
  );
};

export default App;
