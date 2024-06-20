import { AnyComponent } from "@reconjs/utils-react"
import {
  Atom,
  Atoms,
  Modelable,
  Modeled,
  SerializedNode,
} from "@reconjs/internals"
import { FunctionComponent } from "react"
import { Collection } from "@reconjs/core"
import { Serial } from "@reconjs/utils"

export type Importer <T> = () => Promise <{
  default: T,
}>

export type AnyViewDef = (...args: Atoms <any>) => AnyComponent

export type AnyViewFactory = (...args: Modelable[]) => FunctionComponent <any>



// viaRender

export type ReconProp = {
  runtime: SerializedNode,
  args: Array <{
    __RECON__: "model",
    model: string,
    value: string,
  }>,
}

export type SerialScope = {
  key: string,
  value: Serial,
}

export type HydrateView = {
  
}



// usingView / usingListView

export type NestedViewFactory <A = any> = (arg: A) => FunctionComponent <any>

export type ListViewFactory <
  A extends Atom = Atom
> = (arg: A) => FunctionComponent <any>

export type AnyListAtom = Atom <Collection <Modeled>>

