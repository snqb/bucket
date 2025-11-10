import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus } from "lucide-react";

interface AddListDialogProps {
  onAdd: (name: string) => void;
  variant?: "button" | "icon";
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddListDialog({
  onAdd,
  variant = "icon",
  className,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: AddListDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "button" ? (
          <Button className={`bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70 ${className}`}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first list
          </Button>
        ) : (
          <Button
            className={`size-10 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70 ${className}`}
            aria-label="Add new list"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New List</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter list name..."
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName("");
                setOpen(false);
              }}
              className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
