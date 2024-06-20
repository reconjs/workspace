import { Func } from "@reconjs/utils"

type ReconEffect = () => any
type FuncOf <T> = T extends Func ? T : () => T

export type Recon <T = any> = FuncOf <T> 
  & Generator <ReconEffect, ReturnType <FuncOf <T>>>

export function use$ <T extends Func <Recon>> (
  resource: T, 
  ...args: Parameters <T>
): ReturnType <T> {
  function execute () {

  }

  const res: any = execute
  res[Symbol.iterator] = function*() {
    
  }

  return res as ReturnType <T>
}

function Layout () {
  const Header = use$ (Header$)
}

function* Header$ () {
  const data = yield* use$ (data$)
  return () => (
    <div>{data.star}</div>
  )
}

function* data$ () {
  return {
    star: true
  }
}
