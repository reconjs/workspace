import { Suspense } from "react"
import { ReconClient } from "@reconjs/react"

import { HomePage } from "./page"

import { useLocation } from "../use-location"
import { ProductPage } from "../product-page"

export function App () {
  const { pathname = "" } = useLocation()

  let Page = HomePage
  if (pathname.startsWith ("/product/")) Page = ProductPage

  return (
    <ReconClient>
      <Suspense fallback="Loading...">
        <Page />
      </Suspense>
    </ReconClient>
  )
}
