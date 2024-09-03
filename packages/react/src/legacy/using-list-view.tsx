import {
  Atom,
  InferModel,
  usingMode,
} from "@reconjs/internals"

import { AnyComponent } from "@reconjs/utils-react"

import { ClientMode } from "./client/mode"
import { StaticMode } from "./static/mode"
import { ServerMode } from "./server/mode"
import { usingClientListView } from "./client/defined-view"
import { usingStaticListView } from "./static/defined-view"
import { usingServerListView } from "./server/defined-view"
import { AnyListAtom, ListViewFactory } from "./types"
import { usingListViewAux } from "./lib/hooks/view"

const DynamicViewError: AnyComponent = () => {
  throw new Error ("")
}

function usingAux (
  atom: AnyListAtom, 
  factory: ListViewFactory
): AnyComponent {
  const mode = usingMode ()

  if (mode === ClientMode) return usingClientListView (atom, factory)
  if (mode === StaticMode) return usingStaticListView (atom, factory)
  if (mode === ServerMode) return usingServerListView (atom, factory)

  return usingListViewAux (atom, factory)
}

export function usingListView <
  A extends AnyListAtom,
  F extends ListViewFactory <Atom <InferModel <A>>>,
> (atom: A, factory: F): ReturnType <F> {
  return usingAux (atom, factory as any) as ReturnType <F>
}
