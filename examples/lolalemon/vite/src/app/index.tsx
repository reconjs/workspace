import { Suspense, useState } from "react"
import { Hook$, ReconRoot, View$ } from "@reconjs/react"
import recon from "@reconjs/core"

import { HomePage } from "./page"

import { Counter } from "./counter"
import { useLocation } from "../use-location"
import { ProductPage } from "../product-page"

async function handler () {
  return {} as any
}

export function App () {
  const { pathname = "" } = useLocation()

  let Page = HomePage
  if (pathname.startsWith ("/product/")) Page = ProductPage

  return (
    <ReconRoot handler={handler}>
      <Suspense>
        <Page />
      </Suspense>
    </ReconRoot>
  )
}
