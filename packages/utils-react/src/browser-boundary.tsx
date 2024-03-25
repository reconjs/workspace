"use client"

import { PropsWithChildren, useEffect, useState } from "react"

const WIN = typeof window !== "undefined" ? window : undefined

export function BrowserBoundary (props: PropsWithChildren<{}>) {
  const [ show, setShow ] = useState (false)

  useEffect (() => {
    if (WIN) {
      console.log ("start showing")
      setShow (true)
    }
    return () => setShow (false)
  }, [])

  if (!show) return null
  return <>{props.children}</>
}
