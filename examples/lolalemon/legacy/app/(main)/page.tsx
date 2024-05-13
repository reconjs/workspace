import Link from "next/link"
import { viaRender } from "@reconjs/react"
import { withRoute } from "./lib/recon/router"
import { Suspense } from "react"

const Greeting = viaRender (() => import ("./lib/page"))

console.log ("---")
console.log ("--- PAGE ---")
console.log ("---")

const Route = withRoute (Greeting, "/")

const NO_PARAMS = {} as any

export default function Page () {
  return <>
    <div className="p-8 w-full border-b">
      <Link href="/product/align-25" className="text-blue-700 underline">
        Align 25" Pant
      </Link>
    </div>
    <div className="p-8">
      <Suspense fallback="Loading...">
        <Route params={NO_PARAMS} />
      </Suspense>
    </div>
  </>
}
