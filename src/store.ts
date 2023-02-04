import { getYjsDoc, syncedStore } from "@syncedstore/core";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";

export const store = syncedStore({
  bucket: [] as Thingy[],
  today: [] as Thingy[],
});

const doc = getYjsDoc(store);

const provider = new IndexeddbPersistence("bucket", doc);
export let webrtcProvider: WebrtcProvider;
const password = localStorage.getItem("password");
if (password) {
  webrtcProvider = new WebrtcProvider("bucket-sucket", doc, {
    password,
    signaling: [
      "wss://y-webrtc-signaling-eu.herokuapp.com",
      "wss://y-webrtc-signaling-us.herokuapp.com",
    ],
  });

  webrtcProvider.connect();
}

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
