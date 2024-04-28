import recon from "@reconjs/core"
import { View$ } from "@reconjs/react"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const $ = recon ("@/app/lib/page")

/*
const useGreeting$ = $(() => {
  const $greeting = getGreeting$()

  return View$ (() => {
    const text = $greeting()

    return (
      <h1 className="text-2xl">{text}</h1>
    )
  })
})
*/

const Greeting = () => null
const Counter = () => null

export const usePage$ = $(() => {
  // const Greeting = useGreeting$()
  // const Counter = useCounter$()

  return View$ (() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        Hello World
        <Greeting />
        <Counter />
      </article>
    )
  })
})
