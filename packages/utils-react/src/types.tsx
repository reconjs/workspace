import { Func } from "@reconjs/utils"
import React from "react"

export type AnyComponent = keyof JSX.IntrinsicElements 
  | React.JSXElementConstructor <any>
  | React.FunctionComponent <any>

export type PropsOf <C> = C extends AnyComponent 
  ? JSX.LibraryManagedAttributes <C, React.ComponentPropsWithoutRef <C>>
  : {}

export type ClassOf <C extends AnyComponent> = PropsOf <C>["className"]
export type StyleOf <C extends AnyComponent> = PropsOf <C>["style"]

export type InputHandle = {
  getValue: () => string,
}
