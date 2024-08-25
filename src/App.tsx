import ReloadPrompt from "./ReloadPrompt";

import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useMagicGrid } from "use-magic-grid";
import Screen from "./Screen";
import { Button } from "./components/ui/button";
import { bucketDB } from "./store";
import { Link, Route, Switch } from "wouter";
import { usePathname } from "wouter/use-browser-location";

function App() {
  return (
    <>
    <Switch>
        <Route
          path="/"
          component={Bucket}
        />
        <Route
          path="/cemetery"
          component={Cemetery}
        />
      </Switch>
      
      <ReloadPrompt />
    </>
  );
}

const Bucket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lists = useLiveQuery(() => bucketDB.todoLists.toArray());
  const todos = useLiveQuery(() => bucketDB.todoItems.toArray());
  const path = usePathname()

  console.log(path)
  useEffect(() => {
    if (todos?.length) {
      magicGrid.ready() && magicGrid.positionItems();
    }
  }, [todos?.length]);

  const magicGrid = useMagicGrid({
    container: "#bucket-app",
    items: lists?.length ,
    useTransform: true,
    animate: true,
    useMin: true,
    maxColumns: 4,
  });

  return (
    <div ref={containerRef} className="w-screen">
            <motion.div id="bucket-app">
        {lists?.map((it) => (
          <Screen
            className="min-h-48 min-w-[42ch] border border-gray-800 p-2 max-md:w-full"
            key={it.id}
            list={it}
          />
        ))}
      </motion.div>
      <div className="font-bold fixed bottom-0 right-0 ">
        <Link to="/cemetery" className="size-8 bg-blue-500 bg-opacity-50 p-4 text-lg text-white">🪦</Link>
        <Button
        className="size-8 bg-blue-500 bg-opacity-50 p-4 text-lg text-white"
          onClick={() => {
            const name = prompt("Enter the name of the new todo list");
            if (name) {
              bucketDB.todoLists.add({ title: name });
              magicGrid.positionItems();
            }
          }}
        >
          A
        </Button>
      </div>
      
    </div>
  );
};

const Cemetery = () => {
  const cemetery = useLiveQuery(() => bucketDB.cemetery.toArray());
  
  if (!cemetery) return <>Empty</>;
  console.log(cemetery)

  return (
    <div>
      {cemetery.map((it) => <div>{it.title}</div>)}
      <Link to="/" className="fixed size-8 bottom-0 right-0">🪣</Link>
    </div>
  );
}

export default App;
