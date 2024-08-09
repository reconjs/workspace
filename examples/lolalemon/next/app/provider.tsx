"use client"

import { PropsWithChildren } from "react"
import { ReconProvider } from "recon"

export function Provider (props: PropsWithChildren<{}>) {
  return (
    <ReconProvider>
      {props.children}
    </ReconProvider>
  )
}