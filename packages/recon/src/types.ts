import { Func } from "@reconjs/utils"

export type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T>
export type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T>

export type ProcReturns <P extends Proc> = P extends Proc <infer T> ? T : never
export type PracReturns <P extends Prac> = P extends Prac <infer T> ? T : never

export abstract class ReconEffect {}

export abstract class ReconResolver {
  proc!: Proc
  params!: any[]
  current!: any
}

export abstract class ReconScope {
  hoist!: Proc <ReconResolver>
}

export type Recon <T = any> = T extends Func ? T : Generator <ReconEffect, T>
