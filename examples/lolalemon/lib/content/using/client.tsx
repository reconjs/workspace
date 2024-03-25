"use client"

import { viaRender } from "@reconjs/react"
import { ErrorBoundary, PropsOf } from "@reconjs/utils-react"
import { RSC } from "@reconjs/utils-react"

const View = viaRender (() => import ("./recon"))

export default function ClientView (props: PropsOf <typeof View>) {
  console.log ("Content Client", RSC)

  return (
    <ErrorBoundary>
      <View {...props} />
    </ErrorBoundary>
  )
}
