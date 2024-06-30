import { use$ } from "recon"
import { Suspense } from "react"
import { Separate$ } from "./separate"
import { Together$ } from "./together"
  
const fallback = <div>Loading...</div>

export function App () {
  const Together = use$ (Together$)
  const Separate = use$ (Separate$)

  return (
    <main className="flex flex-col items-center justify-center gap-4 p-8">
      <Suspense fallback={fallback}>
        <Together className="flex flex-row gap-4" />
        <Separate className="flex flex-row gap-4" />
      </Suspense>
    </main>
  )
}
