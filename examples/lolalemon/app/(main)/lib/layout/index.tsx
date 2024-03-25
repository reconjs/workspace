import { defineView } from "@reconjs/react"
import { PropsWithChildren } from "react"

import { Header } from "./header"
import { usingFooter } from "./footer"
import { RSC } from "@reconjs/utils-react"

/*
export default defineView (() => {
  type Props = PropsWithChildren <{}>

  const Footer = usingFooter ()

	return (props: Props) => (
    <html lang="en">
      <body>
        <Header className="h-20 border-b" />
        <main className="-mt-20 pt-28 p-8 min-h-screen">
          {props.children}
        </main>
        <Footer className="border-t p-8" />
      </body>
    </html>
  )
})
*/

export default defineView (() => {
  return (props: PropsWithChildren <{}>) => (
    <main>
      {props.children}
    </main>
  )
})
