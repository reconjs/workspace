import $$ from "@reconjs/core"
import { View$ } from "@reconjs/react"
import { Fragment } from "react"

import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const $ = $$("@/app/lib/page")

const useGreeting$ = $(() => {
  const $greeting = getGreeting$()

  return View$ (() => {
    const text = $greeting()

    return (
      <h1 className="text-2xl">{text}</h1>
    )
  })
})

const Counter = Fragment

export default $(() => {
  const Greeting = useGreeting$()
  // const Counter = useCounter$ ()
  return View$(() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <Greeting />
        <Counter />
      </article>
    )
  })
})
