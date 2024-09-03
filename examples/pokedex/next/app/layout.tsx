import "./globals.css"

import { Provider } from "./provider"
import { BrowserBoundary } from "@reconjs/utils-react"

export const metadata = {
  title: "Pokedex",
  description: "Welcome to universal composability!",
}

const fallback = <div>Loading...</div>

export default function RootLayout (props: any) {
  return (
    <html>
      <body>
        <BrowserBoundary>
          {props.children}
        </BrowserBoundary>
      </body>
    </html>
  )
}
