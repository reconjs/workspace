import { ComponentProps, ComponentType, FunctionComponent, MemoExoticComponent, useId, useMemo } from "react"
import { Dispatcher } from "./state"
import { PropsOf } from "@reconjs/utils-react"
import { memoize } from "@reconjs/utils"
import { extendStore, InviewEndEffect, InviewStartEffect } from "./state"

const ERR1 = "useView must be called inside a Recon or React component"

export type View <P> = MemoExoticComponent <
  FunctionComponent <P>
>

export type ViewOf <C extends FunctionComponent <any>> = View <ComponentProps <C>>

export type AnyView = View <any>

function NEVER_VIEW () {
  throw new Error ("NEVER_VIEW")
}

const renderById = memoize ((_: string) => ({
  current: NEVER_VIEW as any,
}))

/*
const handleRender = extendStore (function* (render: () => any) {
  yield new InviewStartEffect()

  try {
    return render ()
  }
  finally {
    yield new InviewEndEffect()
  }
})
*/

const viewById = memoize ((id: string): ComponentType <any> => {
  return function ReconView (props: any) {
    // TODO: Disable non `use` hooks
    const render = renderById (id).current
    return render (props)
  }
})



export function useView <F extends FunctionComponent> (render: F): ViewOf <F> {
  const dispatcher = Dispatcher.current
  if (!dispatcher) throw new Error ("No such hook")
  
  if (dispatcher.useView) return dispatcher.useView (render)

  const id = useId() // eslint-disable-line
  renderById (id).current = render

  // INTENTIONALLY NOT MEMOIZED
  return viewById (id) as MemoExoticComponent <any>
}
