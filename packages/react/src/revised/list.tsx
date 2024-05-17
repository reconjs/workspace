import { Recon, ReconList } from "@reconjs/recon"
import { AnyComponent } from "@reconjs/utils-react";
import { usingListView } from "../using-list-view";
import { usingClientListView } from "../client/defined-view";
import { usingListViewAux } from "../lib/hooks/view"

type InferType <T extends ReconList> = T extends ReconList <infer X> ? X : never

export function useList$ <
  L extends ReconList,
  F extends (ref: Recon <InferType <L>>) => AnyComponent,
> (list: L, factory: F): ReturnType <F> {
  // @ts-ignore
  return usingClientListView (list, factory)
}
