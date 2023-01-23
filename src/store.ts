import { syncedStore, getYjsDoc } from "@syncedstore/core";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
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

export const updateProgress = (id: any, progress: number) => {
  const task = store.bucket.find((it) => it.id === id);
  console.log(task?.residence);

  if (task) task.progress = progress;
};

const doc = getYjsDoc(store);
const provider = new IndexeddbPersistence("bucket", doc);
const webrtcProvider = new WebrtcProvider("bucket-sucket", doc, {
  password: "my-funny-valentine-228",
});

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
