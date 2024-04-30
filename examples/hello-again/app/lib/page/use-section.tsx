import recon, { get$, Model$, provide$, Scope$, Value$ } from "@reconjs/core"
import { View$ } from "@reconjs/react"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const $ = recon ("@/app/lib/page/use-section")

const PLACE$ = $(class Place extends String {})
const LANG$ = $(class Language extends String {})

// PLACES

const getWorld$ = $(() => {
  return Model$ (PLACE$, () => "World")
})

const getNewYork$ = $(() => {
  return Model$ (PLACE$, () => "New York")
})

const getColumbia$ = $(() => {
  return Model$ (PLACE$, () => "Columbia")
})

export const viaPlace$ = $(() => {
  const $place = getWorld$()
  return Scope$ ($place)
})

// Language

const getEnglish$ = $(() => {
  return Model$ (LANG$, () => {
    return "en"
  })
})

const getSpanish$ = $(() => {
  return Model$ (LANG$, () => {
    return "es"
  })
})

const getGreeting$ = $(LANG$)(($lang) => {
  return Value$ (() => {
    const lang = $lang()

    if (lang === "en") return "Hello"
    if (lang === "es") return "Hola"

    throw new Error ("No greeting found!")
  })
})

const useGreeting$ = $(LANG$)(($lang) => {
  const $Place = viaPlace$()
  const $place = get$ ($Place)

  const $greet = getGreeting$ ($lang)

  return View$ (() => {
    const greet = $greet()
    const place = $place()

    return (
      <h1 className="text-2xl">{greet} {place}</h1>
    )
  })
})

const Counter = () => null

export const useSection$ = $(() => {
  const $lang = getEnglish$()
  const Greeting = useGreeting$ ($lang)
  // const Counter = useCounter$()

  return View$ (() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <Greeting />
      </article>
    )
  })
})

export const useEnglishSection$ = $(() => {
  const $place = getNewYork$()
  const $Place = viaPlace$()
  provide$ ($Place, $place)

  const $lang = getEnglish$()
  const Greeting = useGreeting$ ($lang)

  return View$ (() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <Greeting />
      </article>
    )
  })
})

export const useSpanishSection$ = $(() => {
  const $place = getColumbia$()
  const $Place = viaPlace$()
  provide$ ($Place, $place)

  const $lang = getSpanish$()
  const Greeting = useGreeting$ ($lang)

  return View$ (() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <Greeting />
      </article>
    )
  })
})
