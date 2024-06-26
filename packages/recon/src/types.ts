import { Func, Subscribe, createEvent, createStore } from "@reconjs/utils"
import { ReconScope } from "./index"

export type AnyGenerator = Generator <any, any, any>

export type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T>
export type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T>

export type ProcReturns <P extends Proc> = P extends Proc <infer T> ? T : never
export type PracReturns <P extends Prac> = P extends Prac <infer T> ? T : never

export abstract class ReconEffect {}

function doo <T> (func: () => T) {
  return func()
}

export type Recon <T = any> = T extends Func ? T : Generator <ReconEffect, T> & {
  consumer: ReconConsumer
}

export class ReconConsumer {
  scope: ReconScope
  proc: Proc
  params: any[]

  constructor (scope: ReconScope, proc: Proc, ...params: any[]) {
    this.scope = scope
    this.proc = proc
    this.params = params
  }

  protected _event = createEvent()

  get subscribe () {
    return this._event.subscribe
  }

  private _resolver?: ReconResolver

  get resolver (): ReconResolver {
    // if (!this._resolver) throw new Error ("resolver not initialized")
    return this._resolver as any
  }

  private _unsub?: VoidFunction

  set resolver (resolver: ReconResolver) {
    this._unsub?.()
    this._unsub = resolver.subscribe (() => {
      this._event.push()
    })
    this._resolver = resolver
  }

  [Symbol.iterator] = function* () {}
}

export class ReconResolver extends ReconConsumer {
  constructor (scope: ReconScope, proc: Proc, ...params: any[]) {
    super (scope, proc, ...params)
  }

  private _current: any

  get current (): any {
    return this._current
  }

  set current (next: any) {
    this._current = next
    this._event.push()
  }

  get resolver () {
    return this as ReconResolver
  }

  set resolver (next: ReconResolver) {
    throw new Error ("Cannot override a resolver")
  }

  get push () {
    return this._event.push
  }
}
