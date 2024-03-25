import { Atom, InferClassModel, ModelClass, getDefinitionRef, handleHook, usingAtom, usingConstant, usingDefinedAction, usingDefinedEvent, usingHandler } from "@reconjs/recon"
import { defineTraversal } from "./traverse"
import { Serial, memoize, susync } from "@reconjs/utils"

function createValueAtom <T extends Serial> (
  value: T
): Atom <T> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  return res as any
}



type Loader = () => Promise <void>

interface LoaderQueue {
  (loader: Loader): void
  flush: Loader
}

function createQueue () {
  let queue = [] as Array <Loader>
  const res: Partial <LoaderQueue> = (loader: Loader) => {
    queue.push (loader)
  }
  async function flush () {
    const loaders = queue
    queue = []
    await Promise.all (loaders.map (l => l ()))
    if (queue.length > 0) await flush()
  }

  res.flush = flush
  return res as LoaderQueue
}



type ActionSpec = {
  key: string,
  args: any[],
}

export async function resolveActions (...actions: ActionSpec[]) {
  const queue = createQueue ()

  let err = undefined as any

  for (const action of actions) {
    const start = defineTraversal (() => {
      const _usingDefinedAction = usingHandler (usingDefinedAction)

      handleHook (usingDefinedEvent, () => {
        return usingAtom (() => {
          return () => {
            console.log ("--- DEFINED EVENT ---")
          }
        })
      })

      handleHook (usingDefinedAction, (proc, ...args) => {
        handleHook (usingDefinedAction, (proc, ...args) => {
          return _usingDefinedAction (proc, ...args)
        })

        const atom = _usingDefinedAction (proc, ...args)

        usingConstant (() => queue (async () => {
          const func = await susync (() => atom ())
          await func ()
        }))

        return atom
      })
    })

    queue (async () => {
      try {
        const args: any[] = action.args.map (createValueAtom)
        const hook = getDefinitionRef (action.key)
        await start (hook, [], ...args)
      }
      catch (thrown) {
        if (thrown instanceof Promise) {
          err = new Error ("[resolveQuery] threw promise")
        }
    
        err = thrown
      }
    })

    if (err) throw err
    await queue.flush ()
    if (err) throw err
  }
}
