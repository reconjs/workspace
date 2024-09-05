import { ComponentProps, ComponentType, FunctionComponent, MemoExoticComponent, useId } from "react"
import { Dispatcher } from "./react"
import { PropsOf } from "@reconjs/utils-react"
import { memoize } from "@reconjs/utils"
import { extendStore, InviewEndTask, InviewStartTask } from "./state"

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

const handleRender = extendStore (function* (render: () => any) {
  yield new InviewStartTask()

  try {
    return render ()
  }
  finally {
    yield new InviewEndTask()
  }
})

const viewById = memoize ((id: string): ComponentType <any> => {
  return function ReconView (props: any) {
    return handleRender (() => {
      const render = renderById (id).current
      return render (props)
    })
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
