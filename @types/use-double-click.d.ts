import { Ref } from "react";

declare module "use-double-click" {
  export default function useDoubleClick(
    ref: Ref<any>,
    latency: number,
    onSingleClick: () => void,
    onDoubleClick: () => void
  ): any;
}
