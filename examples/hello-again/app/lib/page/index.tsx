"use client"

import { useSection$, useSpanishSection$ } from "./use-section"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const Greeting = () => null
const Counter = () => null

export default function Page () {
  const SpanishGreeting = useSpanishSection$()
  const Greeting = useSection$()

  if (!Greeting) console.error ("Greeting is not defined!")
  if (!SpanishGreeting) console.error ("SpanishGreeting is not defined!")

  return (
    <div>
      <Greeting />
      <SpanishGreeting />
    </div>
  )
}
