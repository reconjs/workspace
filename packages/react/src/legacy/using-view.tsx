import { Atom, InferAtomType, usingMode } from "@reconjs/internals"
import { AnyComponent } from "@reconjs/utils-react"

import { ClientMode } from "./client/mode"
import { usingNestedClientView } from "./client/defined-view"

import { StaticMode } from "./static/mode"
import { usingNestedStaticView } from "./static/defined-view"

import { ServerMode } from "./server/mode"
import { usingNestedServerView } from "./server/defined-view"

import { NestedViewFactory } from "./types"
import { usingNestedView } from "./lib/hooks/view"

function usingAux (
  atom: Atom, 
  factory: NestedViewFactory,
): AnyComponent {
  const mode = usingMode ()

  if (mode === ClientMode) return usingNestedClientView (atom, factory)
  if (mode === StaticMode) return usingNestedStaticView (atom, factory)
  if (mode === ServerMode) return usingNestedServerView (atom, factory)

  return usingNestedView (atom, factory)
}

export function usingView <
  A extends Atom,
  F extends NestedViewFactory <InferAtomType <A>>,
> (atom: A, factory: F) {
  return usingAux (atom, factory) as ReturnType <F>
}
