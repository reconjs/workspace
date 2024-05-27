import { Suspense } from "react"
import recon, { Value$, get$ } from "@reconjs/core"

import { Hook$, View$ } from "@reconjs/react"
import { useLocation } from "../use-location"

const $ = recon ("@/app")

const viaPath$ = $(() => {
  return Hook$ (() => {
    const { pathname } = useLocation()
    return pathname
  })
})

const getCode$ = $(() => {
  return Value$ (() => {
    return 400
  })
})

const useDefaultPage$ = $(() => {
  const $code = getCode$()

  return View$ (() => {
    const code = $code()
    return (
      <main className="flex flex-col items-start justify-start gap-8 p-8">
        <p>Not Found</p>
        <p>Code: {code}</p>
      </main>
    )
  })
})

const useApp$ = $(() => {
  // const $path = get$ (viaPath$())

  const Page = useDefaultPage$()

  /*
  const Page = use$ (() => {
    const $path = use$ (() => usePath$())
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
