import { 
  AsyncGeneratorFunction, 
  Clazz, 
  Ganr, 
  GeneratorFunction, 
  Genr, 
  Returns,
} from "../types"

const THROWS = new WeakMap <Subject <any>, any>()
const RETURNS = new WeakMap <Subject <any>, any>()
const HANDLERS = new Map <Clazz, SubjectHandler <any>>()

const FAULTS = new Set <Fault>()

/**
 * Returns the first registered fault.
 */
export function fault() {
  return FAULTS.values().next().value
}

/**
 * Fault = Fatal Error
 */
export class Fault extends Error {
  constructor (message: string) {
    super (message)
    this.name = this.constructor.name
  }
}

export abstract class Subject <T> {
  *[Symbol.iterator](): Generator <Subject<any>, T, void> {
    yield this as any

    if (THROWS.has (this)) throw THROWS.get (this)
    if (RETURNS.has (this)) return RETURNS.get (this)
    throw new Error ("Subject was not handled")
  }
}

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

export function onPerform <S extends Subject <any>> (
  clazz: Clazz <S>,
  handler: SubjectHandler<S>,
): void {
  if (HANDLERS.has (clazz)) {
    throw new Error ("[initHandler] already initialized")
  }
  HANDLERS.set (clazz, handler)
}

// AUXILIARY FUNCTIONS

type SubjectHandler <S extends Subject <any>> = 
  Genr <InferSubject <S>, Subject <any>, [ S ]>

type InferSubject <T> = T extends Subject<infer X> 
  ? X 
  : never

type Performer <T = any> = Genr <T, Subject<any>> 
  | Ganr <T, Subject<any>>

function performSync (func: Genr <any, Subject<any>>) {
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

async function performAsync (func: Ganr <any, Subject<any>>) {
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

function runHandler (subject: Subject<any>) {
  console.group ("handling...", subject)
  try {
    if (! (subject instanceof Subject)) {
      throw new Fault ("Not a subject.")
    }

    if (FAULTS.size > 0) throw fault()

    const clazz = subject.constructor as Clazz
    const handler = HANDLERS.get (clazz)
    if (!handler) throw new Fault (`No handler for ${clazz}.`)

    const iter = handler (subject)

    for (const _ of loop ("runHandler")) {
      const { done, value } = iter.next()
      if (done) {
        RETURNS.set (subject, value)
        return
      }

      if (! (value instanceof Subject)) {
        throw new Fault ("Yielded was not a subject.")
      }

      runHandler (value)
    }
  }
  catch (error) {
    console.error ("[runHandler] error", error)
    if (error instanceof Fault) FAULTS.add (error)
    THROWS.set (subject, error)
  }
  finally {
    console.groupEnd()
  }
}

// UTILITIES

function* loop (debug: string) {
  for (let i = 0; i < 100; i++) {
    yield null
  }
  
  throw new Error (`[loop] too much (${debug})`)
}