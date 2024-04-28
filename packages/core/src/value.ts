import { Recon, ReconHook, isReconRunning } from "@reconjs/recon"

export function Value$ <
  F extends () => any
> (resolve: F) {
  type T = ReturnType <F>
  type R = ReconHook <Recon <T>>

  // TODO: Get the instructions from define.

  const res: Partial <R> = () => {
    // TODO: Default behavior.
    const instructions = []

    return function resolveValue$ (...args: any[]) {

    }
  }
  res.__RECON__ = "hook"

  return res as R
}
