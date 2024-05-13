"use client"

import "./import"

import { ReconRoot } from "@reconjs/react"
import { Fanc } from "@reconjs/utils"
import { PropsOf, useInitial } from "@reconjs/utils-react"
import { useCallback, useRef } from "react"

export default function Root (props: PropsOf <typeof ReconRoot>) {
  const requested = useInitial (() => new Set <string> ())

  const handler = useCallback <Fanc> (async (payload) => {
    const json = JSON.stringify (payload)
    const prev = requested.size
    requested.add (json)
    if (prev === requested.size) {
      throw new Error ("You've already requested this!")
    }

    return props.handler (payload)
  }, [])

  return <ReconRoot {...props} handler={handler} />
}
