import { Recon, ReconResult, isReconRunning } from "@reconjs/recon"

export function Value$ <
  F extends () => any
> (factory: F) {
  type T = ReturnType <F>
  type R = ReconResult <Recon <T>>

  // TODO: Get the instructions from define.

  function ReconValue (...args: any[]) {
    if (!isReconRunning ()) {
      throw new Error ("[Value$] cannot be called outside of a Recon context.")
    }

    // TODO: Default behavior.
  }

  const res: Partial <R> = ReconValue.bind (null)
  res.__RECON__ = "result"

  return res as R
}
