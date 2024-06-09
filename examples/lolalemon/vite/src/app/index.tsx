import { PropsWithChildren, Suspense } from "react"
import recon, { Value$, get$ } from "@reconjs/core"

import { Hook$, View$ } from "@reconjs/react"
import { useLocation } from "../use-location"

const $ = recon ("@/app")

const $Url = $(class Url extends String {})
const $Product = $(class Product extends String {})

const Product$ = $Product ((url) => {
  if (url.startsWith ("/product/align-25")) return "a-25"

  // TODO: 
  return null as any
}, [ $Url ])

const getProduct$ = $($Url) (($url) => {
  return Product$ ($url)
})

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

  return View$ ((props: PropsWithChildren) => {
    const code = $code()
    return (
      <main className="flex flex-col items-start justify-start gap-8 p-8">
        <p>Not Found</p>
        <p>Code: {code}</p>
        {props.children}
      </main>
    )
  })
})

const useApp$ = $($Url) (($url) => {
  // const $path = get$ (viaPath$())

  const Page = useDefaultPage$()
  const $product = getProduct$ ($url)

  /*
  const Page = use$ (() => {
    const $path = use$ (() => usePath$())
    const path = $path()

    if (path === "/") return useHomePage$()
    return useDefaultPage$()
  })
  */

  return View$ (() => {
    const product = $product()
    console.log (product)

    return (
      <Page>
        <p>Product: {product}</p>
      </Page>
    )
  })
})

export function App () {
  const $url = $Url ("/product/align-25")
  const App = useApp$ ($url)

  return (
    <Suspense fallback="Loading...">
      <App />
    </Suspense>
  )
}
