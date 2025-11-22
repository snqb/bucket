import { useLists, createList } from "@bucket/core";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@bucket/ui";
import { Plus } from "lucide-react";
import { useState } from "react";

export function Manager() {
  const lists = useLists();
  const [newListTitle, setNewListTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const openListWindow = async (listId: string, title: string) => {
    try {
      await invoke("open_list_window", {
        listId,
        listTitle: `${title} 🪣`,
      });
    } catch (error) {
      console.error("Failed to open list window:", error);
    }
  };

  const handleCreateList = () => {
    if (newListTitle.trim()) {
      createList(newListTitle.trim(), "📝");
      setNewListTitle("");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-black p-4">
      <h2 className="mb-4 text-sm font-semibold text-white">Your Lists</h2>
      <div className="flex flex-col gap-2">
        {lists.map((list) => (
          <Button
            key={list.id}
            onClick={() => openListWindow(list.id, list.title)}
            variant="outline"
            className="justify-start text-left"
          >
            <span className="mr-2">{list.emoji}</span>
            {list.title}
          </Button>
        ))}

        {isCreating ? (
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateList();
                if (e.key === "Escape") setIsCreating(false);
              }}
              placeholder="List name..."
              className="flex-1 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white outline-none focus:border-gray-400"
            />
            <Button
              onClick={handleCreateList}
              size="sm"
              className="px-2"
            >
              Add
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsCreating(true)}
            variant="ghost"
            className="justify-start text-gray-400 hover:text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New List
          </Button>
        )}
      </div>
    </div>
  );
}
