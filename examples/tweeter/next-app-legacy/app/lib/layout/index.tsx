import { defineView } from "@reconjs/react"
import { PropsWithChildren } from "react"

export default defineView (() => {
  return (props: PropsWithChildren <{}>) => <>
    <header role="banner" className="flex-1">
    </header>
    <main className="flex flex-row border-x md:w-[600px] divide-y">
      {props.children}
    </main>
    <footer className="hidden md:flex flex-1">
    </footer>
  </>
})
