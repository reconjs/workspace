import { Func } from "@reconjs/utils"
import { Clazz, Genr } from "../types"

export abstract class Subject {}

export type SubjectHandler = Genr <void, Subject, [ Subject ]>

const HANDLERS = new Map <Clazz, SubjectHandler>()



// PRIMARY FUNCTIONS

export function runHandler (subject: Subject) {
  const handler = HANDLERS.get (subject.constructor as Clazz)
  if (!handler) {
    console.error ("[runHandler] not found!", subject)
    throw new Error ("Error in runHandler")
  }

  const iter = handler (subject)

  for (const _ of loop ("runHandler")) {
    const { done, value } = iter.next()
    if (done) return value

    if (! (value instanceof Subject)) {
      throw new Error ("[runHandler] only accepts Subjects")
    }

    runHandler (value)
  }
}

export function initHandler (clazz: Clazz, handler: SubjectHandler) {
  if (HANDLERS.has (clazz)) {
    throw new Error ("[initHandler] already initialized")
  }
  HANDLERS.set (clazz, handler)
}



// UTILITIES

function* loop (debug: string) {
  for (let i = 0; i < 100; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}