import { 
  AnyPrimitive,
  Atom, 
  Modelable,
  Recon,
  ReconComponent,
  ReconResolver,
  createRoot,
  usingPrepasser,
} from "@reconjs/recon"
import { RSC } from "@reconjs/utils-react"
import { FunctionComponent, memo, useMemo } from "react"
import { memoize } from "@reconjs/utils"

type AnyView = FunctionComponent <any>

// TODO: Make universal
type ReconScope = {}

function toRender (
  scope: ReconScope,
  component: ReconComponent,
  ...args: Recon[]
) {
  return createRoot ().exec (() => {
    const resolver = component.factory (...args)
    const { render } = resolver as ReconViewResolver <AnyView>
    return render
  })
}

const execBy = memoize ((hook: ReconComponent) => {
  return (..._args: any[]) => {
    const args: Recon[] = _args.map ((arg: any) => {
      if (arg.__RECON__ === "modeled") {
        const res: any = () => arg.value
        res.__RECON__ = "local"
        return res
      }
      
      return arg
    })
    
    const resolver = hook.factory (...args)
    const { render } = resolver as ReconViewResolver <AnyView>
    return render
  }
})

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
      {/*<ReconOrchestrator />*/}
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

  resolve = (...args: Recon[]) => {
    // TODO: Don't use atoms...
    // const fn = execBy (this.hook)
    const atoms = args as any[] as Atom<Modelable>[]

    const prepass = usingPrepasser ()

    if (prepass) {
      const fn = execBy (this.component)
      return prepass (fn, ...args)
    }
    
    // const mode = usingMode ()

    const res = viewBy (this.component, ...args.map (a => a()))
    return res as V
  }
}

export function View$ <V extends AnyView> (view: V) {
  return new ReconViewResolver <V> (view)
}
