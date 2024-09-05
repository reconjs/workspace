import React from "react"
import { ReactDispatcher } from "./hooks"

function doo <T> (func: () => T) {
  return func()
}



// @ts-ignore
const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
if (!internals) {
  console.log (Object.keys (React))
  throw new Error ("INTERNALS NOT FOUND")
}



export const Dispatcher = {
  get current (): ReactDispatcher|null {
    return internals.H
  },
  set current (dispatcher: ReactDispatcher|null) {
    internals.H = dispatcher
  }
}


// #region _use

const NEVER = {} as any

/**
 * A hook for a constant
 */
export function _use <T> (factory: () => T) {
  const dispatcher = Dispatcher.current
  if (!dispatcher) return factory()
  
  const { _use } = dispatcher
  if (_use) return _use (factory)
  
  const ref = dispatcher.useRef (NEVER) // eslint-disable-line

  if (ref.current === NEVER) {
    ref.current = factory()
  }

  return ref.current as T
}

// #endregion _use
