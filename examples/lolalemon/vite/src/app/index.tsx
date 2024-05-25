import { Suspense } from "react"
import recon, { get$ } from "@reconjs/core"

import { Hook$, View$ } from "@reconjs/react"
import { useLocation } from "../use-location"

const $ = recon ("@/app")

const viaPath$ = $(() => {
  return Hook$ (() => {
    const { pathname } = useLocation()
    return pathname
  })
})

const useDefaultPage$ = $(() => {
  return View$ (() => {
    return <p>Not Found</p>
  })
})

const useApp$ = $(() => {
  const $path = get$ (viaPath$())

  const Page = useDefaultPage$()
  /*
  const Page = useView$ (() => {
    const path = $path()
    if (path === "/") return useHomePage$()
    return useDefaultPage$()
  })
  */

  return View$ (() => {
    return <Page />
  })
})

export function App () {
  const App = useApp$()

  return (
    <Suspense fallback="Loading...">
      <App />
    </Suspense>
  )
}
