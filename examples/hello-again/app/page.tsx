import { BrowserBoundary } from "@reconjs/utils-react"
import Page from "./lib/page"

export default function RootPage () {
  return (
    <BrowserBoundary>
      <Page />
    </BrowserBoundary>
  )
}
