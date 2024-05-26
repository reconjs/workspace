import { 
  AnyPrimitive,
  Atom, 
  Modelable,
  Recon,
  ReconComponent,
  ReconResolver,
  usingMode,
  usingPrepasser,
} from "@reconjs/recon"
import { RSC } from "@reconjs/utils-react"
import { FunctionComponent, memo, use, useMemo } from "react"
import { memoize } from "@reconjs/utils"

type AnyView = FunctionComponent <any>

/*
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
    
    const resolver = hook.factory (...args) as ReconViewResolver <AnyView>
    return resolver.render
  }
})
*/

const viewBy = memoize ((
  hook: ReconComponent,
  ...args: AnyPrimitive[]
) => {
  const params: Recon[] = args.map ((arg): any => {
    const res = () => arg
    res.__RECON__ = "ref"
    return res
  })

  function ReconView (props: any) {
    // TODO: Get Context

    const { render } = useMemo (() => {
      const res = hook.factory (...params)
      return res as ReconViewResolver <AnyView>
    }, [])

    return render (props)
  }

  return memo (ReconView) as AnyView
})

const entryBy = memoize ((
  hook: ReconComponent,
  ...args: AnyPrimitive[]
) => {
  const ReconView = viewBy (hook, ...args)

  return function ReconEntry (props: any) {
    return <>
      {/*<ReconOrchestrator />*/}
      <ReconView {...props} />
    </>
  }
})

class ReconViewResolver <V extends AnyView> extends ReconResolver <V> {
  render: V

  constructor (view: V) {
    super ()
    this.render = view
  }

  invoke = (...args: Recon[]): V => {
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

    return entryBy (this.hook, ...values)
  }

  resolve = (...args: Recon[]): V => {
    // TODO: Don't use atoms...
    // const fn = execBy (this.hook)
    const atoms = args as any[] as Atom<Modelable>[]

    const prepass = usingPrepasser ()

    if (prepass) {
      // return prepass (fn, ...args)
    }
    
    // const mode = usingMode ()

    return viewBy (this.hook, ...args.map (a => a()))
  }
}

export function View$ <V extends AnyView> (view: V) {
  return new ReconViewResolver <V> (view)
}
