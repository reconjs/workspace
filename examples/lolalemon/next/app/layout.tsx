import { Suspense } from "react"
import "./globals.css"

import { Provider } from "./provider"
import { BrowserBoundary } from "@reconjs/utils-react"

export const metadata = {
  title: "Recon",
  description: "Welcome to universal composability!",
}

const fallback = <div>Loading...</div>

export default function RootLayout (props: any) {
  return (
    <html>
      <body>
        <Provider>
          <Suspense fallback={fallback}>
            <BrowserBoundary>
              {props.children}
            </BrowserBoundary>
          </Suspense >
        </Provider>
      </body>
    </html>
  )
}
