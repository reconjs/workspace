import { Loadable, isLoadable, resolved } from "./loadable"

type Func = (...args: any[]) => any

const MAX = 40
const MSG = `Likely infinite loop in susync (${MAX} retries)`

export async function susync <T> (func: () => T): Promise <T> {
  try {
    let i = -1
    let promise: Loadable<any>|null = resolved (null)

    while (promise) {
      i += 1
      if (i > 0) console.log ("attempt", i)
      if (i > MAX) throw new Error (MSG)
      
      try {
        // @ts-ignore
        susync.onStart?.()

        console.assert (isLoadable (promise))
        await promise
        promise = null

        return func ()
      }
      catch (thrown) {
        if (thrown instanceof Promise) {
          promise = thrown
        }
        else {
          throw thrown
        }
      }
      finally {
        // @ts-ignore
        susync.onComplete?.()
      }
    }
  }
  catch (err) {
    // console.error (err)
    throw err
  }

  throw new Error ("[susync] should not reach here")
}
