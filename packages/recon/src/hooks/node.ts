import { AnyFunction, susync } from "@reconjs/utils"
import { HANDLER, ReconHandler } from "./handler"
import { defineHook } from "./define-hook"

function debugOf (x: any, next?: string): string|undefined {
  // @ts-ignore
  if (next) x.debugLabel ||= next
  // @ts-ignore
  return x.debugLabel
}

let current: ReconStep|undefined

export function isReconRunning () {
  return !!current
}


const NEVER: any = {
  __RECON__: "never"
}

export class ReconStep {
  prev?: ReconStep
  next?: ReconStep

  value = NEVER

  node!: ReconNode
  handler!: ReconHandler

  constructor (prev?: ReconStep) {
    this.prev = prev
    if (prev) {
      prev.next = this
      this.node = prev.node
      this.handler = prev.handler
    }
  }
}



// Meta Hooks

// const usingBegin = defineHook (() => {
//   return () => {}
// })

// const usingEnd = defineHook (() => {
//   return () => {}
// })

// debugOf (usingBegin, "usingBegin")
// debugOf (usingBegin, "usingEnd")

// Node

class ReconNode extends ReconStep {
  constructor (handler: ReconHandler) {
    super ()
    this.handler = handler
    this.node = this
    this.exec = this.exec.bind (this)
    this.susync = this.susync.bind (this)
  }

  exec <T> (factory: () => T): T {
    if (current) {
      console.warn ("[exec] call inside of another node")
    }
    const prev = current
    current = this
  
    try {
      // const begin = usingBegin ()
      // begin ()

      const res = factory ()

      // const end = usingEnd ()
      // end ()

      return res
    }
    finally {
      current = prev
    }
  }

  async susync <T> (factory: () => T) {
    return await susync (() => this.exec (factory))
  }
}

export type { ReconNode }

export const ROOT = new ReconNode (HANDLER)

export const createRoot = () => new ReconNode (HANDLER)



// BASE HOOKS

function usingNext () {
  if (!current) throw new Error ("[usingNode] Recon hook")
  current.next ||= new ReconStep (current)
  current = current.next
  return current
}

export function usingConstant <T> (factory: () => T) {
  const step = usingNext ()
  current = undefined

  try {
    if ("usingConstant" !== debugOf (step, "usingConstant")) {
      throw new Error ("[usingConstant] debugLabel mismatch " + debugOf (step))
    }

    if (step.value === NEVER) {
      step.value = factory ()
    }

    return step.value as T
  }
  finally {
    current = step
  }
}

// NODE HOOKS

export function usingParent () {
  const step = usingNext ()
  return step.node
}

export function createNode (parent: ReconNode) {
  return new ReconNode (parent.handler)
}

export function usingChildFactory () {
  const step = usingNext ()
  if (step.value === NEVER) {
    step.value = () => new ReconNode (step.handler)
  }
  return step.value as () => ReconNode
}

export function usingChild () {
  const step = usingNext ()

  if (step.value === NEVER) {
    let handler = step.handler
    step.value = new ReconNode (handler)
  }

  return step.value as ReconNode
}



// HANDLER HOOKS

export function handleHook <T extends AnyFunction> (
  hook: T, 
  impl: (...args: Parameters<T>) => ReturnType<T>
) {
  const node = usingNext ()

  const isInit = node.value === NEVER
  if (isInit) {
    node.handler = new ReconHandler (node.handler)
    node.handler.set (hook, impl)
    node.value = true
  }
}

export function usingHandler <T extends AnyFunction> (hook: T) {
  if (typeof hook !== "function") {
    throw new Error ("[usingHandler] function expected")
  }
  if (hook.__RECON__ !== "internal-hook") {
    throw new Error ("[usingHandler] internal-hook expected")
  }

  const debugLabel = debugOf (hook)

  const step = usingNext ()

  if (debugLabel !== debugOf (step, debugLabel)) {
    const obj = {
      hook: debugLabel,
      step: debugOf (step)
    }
    const json = JSON.stringify (obj, null, 2)
    throw new Error ("[usingHandler] debugLabel mismatch " + json)
  }

  try {
    return step.handler.get (hook) as T
  }
  catch (err) {
    if (debugLabel) {
      console.error ("Error occurred in hook:", debugLabel)
    }
    throw err
  }
}



// Begin & End
// TODO: Are these even necessary anymore?

export function usingBeginEffect (effect: () => void) {
  const begin = usingBegin ()

  handleHook (usingBegin, () => () => {
    begin ()
    effect ()
  })
}

export function usingEndEffect (effect: () => void) {
  const end = usingEnd ()

  handleHook (usingEnd, () => () => {
    end ()
    effect ()
  })
}
