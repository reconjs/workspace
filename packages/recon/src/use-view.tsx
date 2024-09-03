import { FunctionComponent } from "react"
import { Dispatcher } from "./react"

const ERR1 = "useView must be called inside a Recon or React component"

type ReconView = {
  $$typeof: symbol // TODO: Symbol("react.memo")
  compare: null
  type: FunctionComponent
  get displayName (): string
  set displayName (value: string)
}

export function useView <
  T extends FunctionComponent <any>
> (view: T): T {
  const dispatcher = Dispatcher.current
  if (!dispatcher) throw new Error (ERR1)
  if (dispatcher.useView) return dispatcher.useView (view)
  
  throw new Error ("[useView] expected in a Recon Component")
}
