import { Func, Subscribe, createEvent, createStore } from "@reconjs/utils"

export type Clazz <T = any> = {
  new (...args: any[]): T
}

function* NON_ITERATOR () {}
async function* NON_ASYNC_ITERATOR () {}

export const GeneratorFunction = NON_ITERATOR.constructor
export const AsyncGeneratorFunction = NON_ASYNC_ITERATOR.constructor

export type AnyGenerator = Generator <any, any, any>

export type Genr <T = any, Y = any, A extends any[] = any[]> = (...args: A) => Generator <Y, T>
export type Ganr <T = any, Y = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <Y, T>

export type Proc0 <T = any> = () => Generator <any, T>
export type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T>
export type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T>

export type Returns <F extends Func> = (
  F extends Proc <infer T> ? T 
  : F extends Prac <infer X> ? X
  : F extends Genr <infer X> ? X
  : F extends Ganr <infer X> ? X
  : Awaited <ReturnType <F>>
)

export type Yielded <T> = 
  T extends Generator <any, infer X> ? X
  : T extends AsyncGenerator <any, infer X> ? X
  : T


// Effects

export class ReconEffect {}