import { syncedStore, getYjsDoc } from "@syncedstore/core";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";

const fakeOne = {
  createdAt: new Date(),
  id: crypto.randomUUID(),
  progress: 25,
  residence: "default",
  title: {
    text: "Fake one",
    emoji: "🦆",
  },
};

export const store = syncedStore({
  bucket: [] as Thingy[],
});

const doc = getYjsDoc(store);
const provider = new IndexeddbPersistence("bucket", doc);

export type Thingy = {
  id: string;
  title: Title;
  createdAt: Date;
  deletedAt?: Date;
  progress: number;
  residence: Residence;
  description?: string;
};

type Title = {
  text: string;
  emoji: string;
};

type Residence = "default" | "graveyard" | string;
