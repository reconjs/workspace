import { AnyFunction, Func, Vunc } from "@reconjs/utils"
import { Clazz, GeneratorFunction, Genr, Yielded } from "../types"
import { initHandler, Subject, SubjectHandler } from "./handlers"

export abstract class Pointer <T = any> extends Subject {
  #generator: Generator <Subject, T>

  constructor() {
    super()
    const _this = this

    // @ts-ignore
    this.#generator = doo (function* () {
      yield _this
      throw new Error ("[Pointer] unhandled.")
    })
  }

  *[Symbol.iterator](): Generator <Subject, T> {
    for (const _ of loop ("Pointer")) {
      const { done, value } = this.#generator.next()
      if (done) return value
      if (value instanceof Skip) continue
      else yield value
    }

    throw new Error ("[Pointer] loop too much")
  }

  implement (func: Genr <any, Subject, []>) {
    // @ts-ignore
    this.#generator = doo (function* () {
      yield new Skip()
      return yield* func()
    })
  }
}





export function onPerform <T extends Pointer> (
  clazz: Clazz <T>,
  handler: Genr <Yielded <T>, Subject, [ T ]>,
): void

export function onPerform <T extends Pointer> (
  clazz: Clazz <T>,
  handler: Func <Yielded <T>, [ T ]>,
): void

export function onPerform <T extends Subject> (
  clazz: Clazz <T>,
  handler: Genr <void, Subject, [ T ]>,
): void

export function onPerform <T extends Subject> (
  clazz: Clazz <T>,
  handler: Func <Promise <void>, [ T ]>,
): void

export function onPerform <T extends Subject> (
  clazz: Clazz <T>,
  handler: Func <void, [ T ]>,
): void

export function onPerform (
  clazz: Clazz <unknown>,
  handler: (arg: unknown) => unknown,
): void {
  const isPointer = clazz.prototype instanceof Pointer
  const isGenerator = handler instanceof GeneratorFunction

  // !Pointer + Generator is already correct
  let setup = (fn: Func) => fn as SubjectHandler

  if (isPointer && isGenerator) setup = setupPointerWithGenerator
  if (isPointer && !isGenerator) setup = setupPointerWithFunction
  if (!isGenerator) setup = setupSubjectWithFunction

  initHandler (clazz, setup (handler))
}



// AUXILIARY FUNCTIONS

/**
 * Only exists to make Generator functions act more intuitively.
 */
class Skip extends Subject {}

function setupPointerWithGenerator (
  handler: Genr <any, Subject, [ Pointer ]>
): SubjectHandler {
  return function* (pointer) {
    if (! (pointer instanceof Pointer)) {
      throw new Error ("[setupPointerWithGenerator] only accepts Pointers")
    }
    const result = yield* handler (pointer)
    pointer.implement (function* () {
      return result
    })
  }
}

function setupPointerWithFunction (
  handler: Func <any, [ Pointer ]>
): SubjectHandler {
  return function* (pointer) {
    if (! (pointer instanceof Pointer)) {
      throw new Error ("[setupPointerWithGenerator] only accepts Pointers")
    }
    const result = handler (pointer)
    pointer.implement (function* () {
      return result
    })
  }
}

function setupSubjectWithFunction (
  handler: Vunc <[ Subject ]>
): SubjectHandler {
  return function* (subject) {
    const returned: any = handler (subject)

    if (returned instanceof Promise) {
      returned.catch ((reason) => {
        console.error ("RECON ASYNC FAULT", reason)
      })
    }
    else if (returned !== undefined) {
      console.warn ("[setupSubjectWithFunction] returned a value")
    }
  }
}



// UTILITIES

function doo <T> (func: () => T) {
  return func()
}

function* loop (debug: string) {
  for (let i = 0; i < 100; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}
