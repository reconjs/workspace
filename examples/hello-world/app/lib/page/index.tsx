import { defineView } from "@reconjs/react"

import { usingGreeting } from "../greeting"
import { usingCounterView } from "@/lib/counter"

const usingGreetingView = defineView (() => {
  const theGreeting = usingGreeting ()

  return () => {
    const text = theGreeting ()

    return (
      <h1 className="text-2xl">{text}</h1>
    )
  }
})

export default defineView (() => {
  const GreetingView = usingGreetingView ()
  const Counter = usingCounterView ()
  return () => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <GreetingView />
        <Counter />
      </article>
    )
  }
})
