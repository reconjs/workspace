import { Func } from "@reconjs/utils"

export type ReconEffect = {}

export type Proc <T = any, A extends any[] = any[]> = (...args: A) => Generator <any, T, any>
export type Prac <T = any, A extends any[] = any[]> = (...args: A) => AsyncGenerator <any, T, any>

export type ProcReturns <P extends Proc> = P extends Proc <infer T> ? T : never
export type PracReturns <P extends Prac> = P extends Prac <infer T> ? T : never

export type Recon <T = any> = T extends Func ? T : Generator <ReconEffect, T, any>
