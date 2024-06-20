import { 
  AnyPrimitive,
  Recon,
  ReconComponent,
  ReconResolver,
  createRoot,
  handle$,
  usingChild,
} from "@reconjs/recon"
import { RSC } from "@reconjs/utils-react"
import { FunctionComponent, memo, useMemo } from "react"
import { memoize } from "@reconjs/utils"
import { Value$ } from "@reconjs/core"

import { ReconManager } from "./look"

type ReconScope = {}

type AnyView = FunctionComponent <any>

function toRender (
  scope: ReconScope,
  component: ReconComponent,
  ...args: Recon[]
) {
  return createRoot ().exec (() => {
    handle$ (Value$, (component: ReconComponent, ...args: Recon[]) => {
      const node = usingChild()

      const ref: any = () => {
        const resolver: any = node.exec (() => {
          return component.factory (...args)
        })

        return resolver.evaluate ()
      }

      ref.__RECON__ = "local"
      return ref
    })

    const resolver = component.factory (...args)
    const { render } = resolver as ReconViewResolver <AnyView>
    return render
  })
}

const viewBy = memoize ((
  component: ReconComponent,
  ...args: AnyPrimitive[]
) => {
  const refs: Recon[] = args.map ((arg): any => {
    const res = () => arg
    res.__RECON__ = "local"
    return res
  })

  // TODO: scope from context
  const scope: ReconScope = {}

  function ReconView (props: any) {
    const render = toRender (scope, component, ...refs)
    return render (props)
  }

  return memo (ReconView) as AnyView
})

const entryBy = memoize ((
  component: ReconComponent,
  ...args: AnyPrimitive[]
) => {
  const ReconView = viewBy (component, ...args)

  return function ReconEntry (props: any) {
    return <>
      <ReconManager {...{ component, args }} />
      <ReconView {...props} />
    </>
  }
})

class ReconViewResolver <V extends AnyView> extends ReconResolver <V> {
  render: V

  constructor (render: V) {
    super ()
    this.render = render
  }

  invoke = (...args: Recon[]) => {
    // As a React hook
    if (RSC) {
      throw new Error ("Not allowed to call in RSC")
    }

    /* ALT: Maybe the root creates the component?
    const ctx = use (ReconContext)
    if (ctx) {
      return ctx.view (this.hook, ...args)
    }
    */

    const values = useMemo (() => {
      return args.map (x => x())
    }, [ ...args ])

    const res = entryBy (this.component, ...values)
    return res as V
  }

  prepass = (...args: Recon[]) => {
    const res: any = () => {
      throw new Error ("No bueno")
    }

    res.__RECON__ = "react.view"
    return res
  }

  resolve = (...args: Recon[]) => {
    const values = args.map (a => a())
    const res = viewBy (this.component, ...values)
    return res as V
  }
}

export function View$ <V extends AnyView> (view: V) {
  return new ReconViewResolver <V> (view)
}
