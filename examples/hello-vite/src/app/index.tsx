import { Suspense } from "react"

import { HomePage } from "./page"
import { ReconRoot } from "@reconjs/react"

async function handler () {
  return {} as any
}

export function App () {
  return (
    <ReconRoot handler={handler}>
      <Suspense>
        <HomePage />
      </Suspense>
    </ReconRoot>
  )
}
