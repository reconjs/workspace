import { Func, Subscribe, createEvent, createStore } from "@reconjs/utils"

export type AnyGenerator = Generator <any, any, any>

export type Proc0 <T = any> = () => Generator <any, T>
export type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T>
export type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T>

export type Returns <F extends Func> = F extends Proc <infer T> ? T : Awaited <ReturnType <F>>


// Effects

export class ReconEffect {}