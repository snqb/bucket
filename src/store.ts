import { getYjsDoc, syncedStore } from "@syncedstore/core";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";

export const store = syncedStore({
  bucket: [] as Thingy[],
  today: [] as Thingy[],
});

const doc = getYjsDoc(store);
const provider = new IndexeddbPersistence("bucket", doc);

const password = localStorage.getItem("password");
if (password) {
  const webrtcProvider = new WebrtcProvider("bucket-sucket", doc, {
    password,
    peerOpts: {
      iceServers: [
        {
          urls: "stun:relay.metered.ca:80",
        },
        {
          urls: "turn:relay.metered.ca:80",
          username: "9fd80a0364763bd1d11735c7",
          credential: "gn1iBVGGn9zsazdp",
        },
        {
          urls: "turn:relay.metered.ca:443",
          username: "9fd80a0364763bd1d11735c7",
          credential: "gn1iBVGGn9zsazdp",
        },
        {
          urls: "turn:relay.metered.ca:443?transport=tcp",
          username: "9fd80a0364763bd1d11735c7",
          credential: "gn1iBVGGn9zsazdp",
        },
      ],
    },
  });

  console.log(webrtcProvider);
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
