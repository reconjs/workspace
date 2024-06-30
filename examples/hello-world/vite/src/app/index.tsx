import { use$ } from "recon"
import { Counter$ } from "./counter"
import { Suspense } from "react"

function TogetherCounters () {
  const Counter = use$ (Counter$)
  
  const fallback = <div>Loading...</div>

  return <>
    <Suspense fallback={fallback}>
      <h1>Counters that update together</h1>
      <div className="flex flex-row gap-8">
        <Counter />
        <Counter />
      </div>
    </Suspense >
  </>
}

function SeparatelyCounters () {
  const CounterLeft = use$ (Counter$)
  const CounterRight = use$ (Counter$)

  return <>
    <Suspense>
      <h1>Counters that update separately</h1>
      <div className="flex flex-row gap-8">
        <CounterLeft />
        <CounterRight />
      </div>
    </Suspense>
  </>
}

export function App () {
  // console.log ("App calling Counter$")
  // const Counter = use$ (Counter$)

  return (
    <main className="flex flex-col items-center justify-center gap-4">
      <TogetherCounters />
      <SeparatelyCounters />
    </main>
  )
}
