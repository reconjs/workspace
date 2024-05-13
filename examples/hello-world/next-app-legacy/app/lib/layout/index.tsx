import { defineView } from "@reconjs/react"
import { PropsWithChildren } from "react"

export default defineView (() => {
  return (props: PropsWithChildren <{}>) => (
    <main>
      {props.children}
    </main>
  )
})
