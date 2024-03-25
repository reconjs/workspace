import "../globals.css"

import { viaRender } from "@reconjs/react"

import { Suspense } from "react"

import ACTION from "./lib/recon/action"

import ReconRoot from "./lib/recon/root"
import { withRoute } from "./lib/recon/router"

export const metadata = {
  title: "lolalemon",
  description: "I bet you like leggings, don't you?",
}

console.log ("---")
console.log ("--- LAYOUT ---")
console.log ("---")

const Layout = viaRender (() => import ("./lib/layout"))

const Root = withRoute (Layout, "/*")

// export default Root

export default function RootLayout (props: any) {
  return (
    <html>
      <body>
        <Suspense>
          <ReconRoot handler={ACTION}>
            <Root params={props.params}>
              {props.children}
            </Root>
          </ReconRoot>
        </Suspense>
      </body>
    </html>
  )
}
