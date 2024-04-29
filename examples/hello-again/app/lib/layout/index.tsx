// import recon from "@reconjs/core"
import { defineView } from "@reconjs/react"
import { PropsWithChildren } from "react"

// const $ = recon ("@/app/lib/layout")

type Props = PropsWithChildren <{}>

export default defineView (() => {
  return (props: Props) => (
    <main>
      {props.children}
    </main>
  )
})
