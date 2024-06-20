import { 
  Adapted,
  Atom, 
  Modelable, 
  ReconNode, 
  createNode, 
  defineHook, 
  handleAtoms, 
  handleHook, 
  usingChild, 
  usingConstant,
  usingContext,
  usingHandler,
  usingProvided,
  usingProvider,
  usingStack,
} from "@reconjs/internals"
import { AnyFunction, susync } from "@reconjs/utils"
import { handleSync } from "./broad"



// ROOT

const usingRoot = defineHook ((): ReconNode => {
  throw new Error ("[usingRoot] not implemented")
})

export function handleRoot (init: () => ReconNode) {
  return handleHook (usingRoot, init)
}



// EXECUTOR

export function usingExecutor (fn: AnyFunction, ...args: Atom[]) {
  const node = usingChild ()
  /*
  const _usingProviders = usingHandler (usingProviders)
  const _usingProvided = usingHandler (usingProvided)
  const _usingContext = usingHandler (usingContext)
  const _usingStack = usingHandler (usingStack)

  const root = usingRoot ()
  */

  // TODO: Register stuff

  return usingConstant (() => {
    /*
    const parent = createNode (root)

    // TODO: Does this need to be started or can we defer?
    const nodePromise = parent.susync (() => {
      handleHook (usingProviders, _usingProviders)
      handleHook (usingProvided, _usingProvided)
      handleHook (usingContext, _usingContext)
      handleHook (usingStack, _usingStack)
      
      // TODO: handlers go here
      return usingChild ()
    })
    */

    return async () => {
      // const node = await nodePromise

      // TODO: Resolve everything else

      console.log ("[usingExecutor] preparing...")

      const models = await Promise.all (
        args.map (a => susync ((): Modelable => ({
          __RECON__: "modeled",
          // @ts-ignore
          model: a.model,
          // @ts-ignore
          optional: a.optional,
          // @ts-ignore
          collection: a.collection,
          value: a(),
          // @ts-ignore
          variable: () => a.variable (),
        })))
      )

      let flush: VoidFunction
      const adapted = await node.susync (() => {
        console.log ("[usingExecutor] start")
        flush = handleAtoms ()
        const res = fn (...models)
        console.log ("[usingExecutor] end")

        return res
      })

      await susync (() => flush ())

      return adapted as Adapted
    }
  })
}
