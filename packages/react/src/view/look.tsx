import { Recon, ReconComponent } from "@reconjs/recon"
import { guidBy, memoize } from "@reconjs/utils"
import { ErrorBoundary, useMemoShallow } from "@reconjs/utils-react"
import { PropsWithChildren, Suspense, createContext, useId } from "react"

const NEVER: any = {}

function doo <T> (func: () => T) {
  return func ()
}



const PreviewContext = createContext ({})

function Boundary (props: PropsWithChildren <{}>) {
  return (
    <ErrorBoundary>
      <Suspense>
        {props.children}
      </Suspense>
    </ErrorBoundary>
  )
}



class ReconMoment {
  static current?: ReconMoment

  private ref = memoize ((_: ReconComponent, ...args: any[]) => {
    return { current: NEVER }
  })

  evaluate = memoize ((c: ReconComponent, ...args: any[]): any => {
    const ref = this.ref (c, ...args)
    if (ref.current === NEVER) {
      // TODO: Initialize
    }
    return ref.current
  })
}



class ReconValue {
  _value?: any

  get value (): any {
    if (this._value === undefined) {
      throw new Error ("Can't be undefined")
    }
    return this._value
  }

  constructor (value?: any) {
    this._value = value
  }
}

const valueOf = memoize ((x: any) => {
  return new ReconValue (x)
})



class ReconPointer extends ReconValue {
  private _args!: ReconValue[]
  private _component!: ReconComponent
  
  get args (): any[] {
    return this._args.map (x => x.value)
  }
  
  get component () {
    return this._component
  }
  
  get value (): any {
    const moment = ReconMoment.current
    if (!moment) throw new Error ("No moment")
    return moment.evaluate (this.component, ...this.args)
  }

  constructor (component: ReconComponent, ...args: ReconValue[]) {
    super ()
    this._component = component
    this._args = args
  }
}

const pointerOf = memoize ((
  component: ReconComponent, 
  ...args: ReconPointer[]
) => {
  if (args.length === 0) return evaluatorOf (component)
  return new ReconPointer (component, ...args)
})



class ReconEvaluator extends ReconPointer {
  id!: string

  constructor (component: ReconComponent, ...args: any[]) {
    super (component, ...args.map (valueOf))
  }
}

const evaluatorOf = memoize ((
  component: ReconComponent, 
  ...args: any[]
) => {
  return new ReconEvaluator (component, ...args)
})



// TODO: What does a Viewer do...
class ReconViewer extends ReconPointer {
  get children () {
    return [] as ReconPointer[]
  }

  get value () {
    throw new Error ("Cannot evaluate")
  }
}

export const viewerOf = memoize ((
  component: ReconComponent, 
  ...args: ReconValue[]
) => {
  return new ReconViewer (component, ...args)
})



function ReconHook (props: {
  component: ReconComponent,
  args: any[],
}) {
  // TODO: Render Hook
  return null
}

function useEvaluatorId (self: ReconEvaluator) {
  const id = useId()
  self.id ??= id
  return self.id === id
}

function ReconRef (props: {
  self: ReconPointer,
}) {
  const { self } = props

  if (self instanceof ReconEvaluator) {
    const render = useEvaluatorId (self)
    if (!render) return null
        
    return (
      <Boundary>
        <ReconHook component={self.component} args={self.args} />
      </Boundary>
    )
  }
  
  else if (self instanceof ReconViewer) {
    const { children } = self // TODO: Filter unnecessary children?
    if (!children) return null
  
    const els = children.map (x => (
      <Boundary>
        <ReconRef key={guidBy (x)} self={x} />
      </Boundary>
    ))
  
    // TODO: What do we provide to Context?
    return (
      <PreviewContext value={{}}>
        {els}
      </PreviewContext>
    )
  }
  
  else {
    const evaluator = evaluatorOf (self.component, ...self.args)
    return <ReconRef self={evaluator} />
  }
}

export function ReconManager (props: {
  component: ReconComponent,
  args: any[],
}) {
  const viewer = useMemoShallow (() => {
    const args = props.args.map (x => valueOf (x))
    return viewerOf (props.component, ...args)
  }, [ props.args ])

  return <ReconRef self={viewer} />
}
