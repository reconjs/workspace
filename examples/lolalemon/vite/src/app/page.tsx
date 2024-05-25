import recon, { Model$, provide$ } from "@reconjs/core"
import { View$ } from "@reconjs/react"

import { LANG$, PLACE$, useGreeting$, viaLanguage$ } from "./greeting"

import { Suspense } from "react"

const $ = recon ("@/app/lib/page/index")

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const getPlaceLanguage$ = $(PLACE$)(($place) => {
  return Model$ (LANG$, () => {
    switch ($place()) {
      case "Columbia": return "es"
      case "New York": return "en"
    }
    
    // return null as never
    throw new Error ("Expected a place with a language")
  })
})

const getWorld$ = $(() => {
  return Model$ (PLACE$, () => "World")
})

const getNewYork$ = $(() => {
  return Model$ (PLACE$, () => "New York")
})

const getColumbia$ = $(() => {
  return Model$ (PLACE$, () => "Columbia")
})

const usePlace$ = $(PLACE$)(($place) => {
  const $lang = getPlaceLanguage$ ($place)
  const $Lang = viaLanguage$()
  provide$ ($Lang, $lang)

  const Greeting = useGreeting$ ($place)

  return View$ (() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <Greeting />
      </article>
    )
  })
})

const useHelloNewYork$ = $(() => {
  const $place = getNewYork$()
  const Place = usePlace$ ($place)

  return View$ (() => <Place />)
})

const useHolaColumbia$ = $(() => {
  const $place = getColumbia$()
  const Place = usePlace$ ($place)

  return View$ (() => <Place />)
})

const useHelloWorld$ = $(() => {
  const $world = getWorld$()
  const Greeting = useGreeting$ ($world)
  return View$ (() => <Greeting />)
})

export const useHomePage$ = $(() => {
  const HelloNewYork = useHelloNewYork$()
  const HolaColumbia = useHolaColumbia$()

  const Greeting = useHelloWorld$()

  return View$ (() => (
    <div>
      <div className="flex flex-row items-center justify-center">
        <Greeting />
      </div>
      <Suspense fallback="Loading...">
        <HelloNewYork />
        <HolaColumbia />
      </Suspense>
    </div>
  ))
})

/*
export function HomePage () {
  const HelloNewYork = useHelloNewYork$()
  const HolaColumbia = useHolaColumbia$()

  const Greeting = useHelloWorld$()

  return (
    <div>
      <div className="flex flex-row items-center justify-center">
        <Greeting />
      </div>
      <Suspense fallback="Loading...">
        <HelloNewYork />
        <HolaColumbia />
      </Suspense>
    </div>
  )
}
*/
