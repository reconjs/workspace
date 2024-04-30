"use client"

import { useEnglishSection$, useSection$, useSpanishSection$ } from "./use-section"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const Greeting = () => null
const Counter = () => null

export default function Page () {
  const SpanishGreeting = useSpanishSection$()
  const EnglishGreeting = useEnglishSection$()
  const Greeting = useSection$()

  if (!Greeting) console.error ("Greeting is not defined!")
  if (!SpanishGreeting) console.error ("SpanishGreeting is not defined!")

  return (
    <div>
      <div className="flex flex-row items-center justify-center">
        <Greeting />
      </div>
      <EnglishGreeting />
      <SpanishGreeting />
    </div>
  )
}
