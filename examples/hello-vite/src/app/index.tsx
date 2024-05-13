import { Suspense } from "react"

import { HomePage } from "./page"
import { ReconRoot } from "@reconjs/react"
import { Counter } from "./counter"

async function handler () {
  return {} as any
}

export function App () {
  return (
    <ReconRoot handler={handler}>
      <Suspense>
        <Counter />
        <HomePage />
      </Suspense>
    </ReconRoot>
  )
}
