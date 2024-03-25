import { AnyFunction } from "@reconjs/utils"
import { FunctionComponent } from "react"
import { 
  Atom, 
  Modelable, 
  defineHook,
} from "@reconjs/recon"
import {
  AnyListAtom, 
  AnyViewFactory, 
  ListViewFactory, 
  NestedViewFactory 
} from "../../types"

function def <T extends AnyFunction> () {
  const body = () => {
    throw new Error ("Not implemented")
  }

  return defineHook <T> (body as any)
}

export const usingDefinedView = def <(
  factory: AnyViewFactory,
  ...args: Atom <Modelable> []
) => FunctionComponent <any>> ()

export const usingNestedView = def <(
  atom: Atom,
  factory: NestedViewFactory,
) => FunctionComponent <any>> ()

export const usingListViewAux = def <(
  atom: AnyListAtom,
  func: ListViewFactory,
) => FunctionComponent <any>> ()
