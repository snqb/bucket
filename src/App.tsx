import ReloadPrompt from "./ReloadPrompt";

import { motion } from "framer-motion";
import Screen from "./Screen";
import { Button } from "./components/ui/button";
import { bucketDB, db } from "./store";
import MagicGrid from "magic-grid";
import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useMagicGrid } from 'use-magic-grid';

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
  const todos = useLiveQuery(() => bucketDB.todoItems.toArray());

  useEffect(() => {
    if (todos?.length ) {
      magicGrid.ready() && magicGrid.positionItems();
    }
  }, [todos?.length])


  const magicGrid = useMagicGrid({
    container: "#bucket-app", // Required. Can be a class, id, or an HTMLElement.
    // static: true,
    items: lists?.length,
    useTransform: true,
    animate: true, // Optional.
    useMin: true,
    maxColumns: 4,
  });

  return (
    <div ref={containerRef} className="w-screen">
      <Button
        onClick={() => {
          const name = prompt("Enter the name of the new todo list");
          if (name) {
            bucketDB.todoLists.add({ title: name });
            magicGrid.positionItems();
          }
        }}
        className="fixed bottom-0 right-0 size-8 bg-red-500 p-4 text-xs text-white"
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
      </motion.div>
    </div>
  );
};

export default App;
