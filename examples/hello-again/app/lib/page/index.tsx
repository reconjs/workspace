"use client"

import { usePage$ } from "./use-section"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const Greeting = () => null
const Counter = () => null

export default function Page () {
  const Greeting = usePage$ ()
  return <Greeting />
}
