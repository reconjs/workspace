import { Recon, ReconList } from "@reconjs/recon"
import { AnyComponent } from "@reconjs/utils-react";
import { usingListView } from "./legacy/using-list-view";
import { usingClientListView } from "./legacy/client/defined-view";
import { usingListViewAux } from "./legacy/lib/hooks/view"

type InferType <T extends ReconList> = T extends ReconList <infer X> ? X : never

export function useList$ <
  L extends ReconList,
  F extends (ref: Recon <InferType <L>>) => AnyComponent,
> (list: L, factory: F): ReturnType <F> {
  // @ts-ignore
  throw new Error ("useList$ is not implemented")
  // return usingClientListView (list, factory)
}
