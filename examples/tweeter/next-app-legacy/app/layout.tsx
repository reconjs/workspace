import "./globals.css"

import { viaRender } from "@reconjs/react"

import { Suspense } from "react"

import ACTION from "./recon/action"
import Root from "./recon/root"
import { withRoute } from "./recon/router"

export const metadata = {
  title: "Recon",
  description: "Welcome to universal composability!",
}

const _Layout = viaRender (() => import ("./lib/layout"))
const Layout = withRoute (_Layout)

export default function RootLayout (props: any) {
  return (
    <html>
      <body className="flex flex-col md:flex-row justify-center divide-x">
        <Suspense>
          <Root handler={ACTION}>
            <Layout params={props.params}>
              {props.children}
            </Layout>
          </Root>
        </Suspense>
      </body>
    </html>
  )
}
