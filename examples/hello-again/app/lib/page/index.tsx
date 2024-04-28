"use client"

import { usePage$ } from "./use-page"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const Greeting = () => null
const Counter = () => null

export default function Page () {
  const Greeting = usePage$ ()
  return <Greeting />
}
