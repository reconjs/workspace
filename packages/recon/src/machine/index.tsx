import { GeneratorFunction, AsyncGeneratorFunction, Ganr, Genr, Returns } from "../types"
import { runHandler, Subject } from "./handlers"

export { Subject } from "./handlers"
export { Pointer, onPerform } from "./register"



type Performer <T = any> = Genr <T, Subject> 
  | Ganr <T, Subject>

export function perform <P extends Performer> (func: P): Returns <P> {
  if (func instanceof GeneratorFunction) {
    // @ts-ignore
    return performSync (func)
  }
  if (func instanceof AsyncGeneratorFunction) {
    // @ts-ignore
    return performAsync (func)
  }
  throw new Error ("[perform] generator function required")
}



// AUXILIARY FUNCTIONS

function performSync (func: Genr <any, Subject>) {
  const iter = func()

  for (const _ of loop ("performSync")) {
    const { done, value } = iter.next()
    if (done) return value

    if (! (value instanceof Subject)) {
      throw new Error ("[performGenerator] only accepts Subjects")
    }

    runHandler (value)
  }
}

async function performAsync (func: Ganr <any, Subject>) {
  const iter = func()

  for (const _ of loop ("performAsync")) {
    const { done, value } = await iter.next()
    if (done) return value

    if (! (value instanceof Subject)) {
      throw new Error ("[performGenerator] only accepts Subjects")
    }

    runHandler (value)
  }
}



// UTILITIES

function* loop (debug: string) {
  for (let i = 0; i < 100; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}