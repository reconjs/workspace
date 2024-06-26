import { use$ } from "recon"
import { Counter$ } from "./counter"

function TogetherCounters () {
  const Counter = use$ (Counter$)

  return <>
    <h1>Counters that update together</h1>
    <div className="flex flex-row gap-8">
      <Counter />
      <Counter color="red" />
    </div>
  </>
}

function SeparatelyCounters () {
  const CounterLeft = use$ (Counter$)
  const CounterRight = use$ (Counter$)

  return <>
    <h1>Counters that update separately</h1>
    <div className="flex flex-row gap-8">
      <CounterLeft />
      <CounterRight color="red" />
    </div>
  </>
}

export function App () {
  return (
    <main className="flex flex-col items-center justify-center gap-4">
      <TogetherCounters />
      <SeparatelyCounters />
    </main>
  )
}
