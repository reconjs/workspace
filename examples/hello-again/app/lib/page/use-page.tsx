import recon, { Value$, isReconRunning } from "@reconjs/core"
import { View$ } from "@reconjs/react"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const $ = recon ("@/app/lib/page")

const getGreeting$ = $(() => {
  return Value$ (() => {
    return "Hello World"
  })
})

const useGreeting$ = $(() => {
  if (isReconRunning()) {
    console.log ("[useGreeting$] recon is running")
  }
  else {
    console.log ("[useGreeting$] recon is not running")
  }

  const $greeting = getGreeting$()

  return View$ (() => {
    const text = $greeting()

    return (
      <h1 className="text-2xl">{text}</h1>
    )
  })
})

const Counter = () => null

export const usePage$ = $(() => {
  if (isReconRunning()) {
    console.log ("[usePage$] recon is running")
  }
  else {
    console.log ("[usePage$] recon is not running")
  }

  const Greeting = useGreeting$()
  // const Counter = useCounter$()

  return View$ (() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <Greeting />
        <Counter />
      </article>
    )
  })
})
