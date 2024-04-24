import $$ from "@reconjs/core"
import { View$ } from "@reconjs/react"
import { PropsWithChildren } from "react"

const $ = $$("@/app/lib/layout")

export default $(() => {
  return View$((props: PropsWithChildren <{}>) => (
    <main>
      {props.children}
    </main>
  ))
})
