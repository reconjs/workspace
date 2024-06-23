import { use$ } from "recon"
import { Counter$ } from "./counter"

async function handler () {
  return {} as any
}

export function App () {
  const Counter = use$ (Counter$)

  return (
    <main className="flex flex-col items-center justify-center gap-4">
      <h1>Counters that update together</h1>
      <Counter />
      <Counter color="red" />
    </main>
  )
}
