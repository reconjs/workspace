import { memo } from "react"
import { ReconNode } from "@reconjs/internals"

import {
  PropsOf,
  createClientContext,
  useContext,
} from "@reconjs/utils-react"

const NEVER = undefined as any

const context = createClientContext (NEVER as ReconNode)
const Provider = memo (context.Provider)

export const RuntimeContext = memo (
  function ReconRuntimeContext (props: PropsOf <typeof Provider>) {
    // ensureRuntime (props.value)

    return (
      <Provider value={props.value}>
        {props.children}
      </Provider>
    )
  }
)

export function useReconRuntime () {
  return useContext (context)
}
