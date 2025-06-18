import ReloadPrompt from "./ReloadPrompt";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useMagicGrid } from "use-magic-grid";
import Screen from "./Screen";
import { Button } from "./components/ui/button";
import {
  useJazzTodoLists,
  useJazzTodoItems,
  useJazzCemeteryItems,
  useJazzActions,
} from "./jazz-store";
import { Link, Route, Switch } from "wouter";
import { usePathname } from "wouter/use-browser-location";

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={Bucket} />
        <Route path="/cemetery" component={Cemetery} />
      </Switch>

      <ReloadPrompt />
    </>
  );
}

const Bucket = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lists = useJazzTodoLists();
  const actions = useJazzActions();

  console.log("LISTS", lists);

  return (
    <div className="w-screen">
      <motion.div ref={containerRef}>
        {lists?.map((it) => (
          <Screen
            className="min-h-48 min-w-[42ch] border border-gray-800 p-2 max-md:w-full"
            key={it.id}
            list={it}
          />
        ))}
      </motion.div>
      <div className="font-bold fixed bottom-0 right-0 ">
        <Link
          to="/cemetery"
          className="size-8 bg-blue-500 bg-opacity-50 p-4 text-lg text-white"
        >
          🪦
        </Link>
        <Button
          className="size-12 bg-blue-500 bg-opacity-50 p-3 text-xl text-white hover:bg-blue-600 hover:bg-opacity-70"
          onClick={() => {
            const name = prompt("Enter the name of the new todo list");
            if (name) {
              actions.addTodoList(name);
              // magicGrid.positionItems();
            }
          }}
        >
          ➕
        </Button>
      </div>
    </div>
  );
};

const Cemetery = () => {
  const cemetery = useJazzCemeteryItems();

  if (!cemetery || cemetery.length === 0) return <>Empty</>;
  console.log(cemetery);

  return (
    <div>
      {cemetery.map((it) => (
        <div key={it.id}>{it.title}</div>
      ))}
      <Link to="/" className="fixed bottom-0 right-0 size-8">
        🪣
      </Link>
    </div>
  );
};

export default App;
