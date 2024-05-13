import recon, { get$, Model$, Scope$, Value$ } from "@reconjs/core"
import { View$ } from "@reconjs/react"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const $ = recon ("@/app/lib/page/greeting")

export const PLACE$ = $(class Place extends String {})
export const LANG$ = $(class Language extends String {})

export const getEnglish$ = $(() => {
  return Model$ (LANG$, () => {
    return "en"
  })
})

export const viaLanguage$ = $(() => {
  const $english = getEnglish$()
  return Scope$ ($english)
})

// PLACES

const getGreeting$ = $(() => {
  const $Lang = viaLanguage$()
  const $lang = get$ ($Lang)

  return Value$ (() => {
    const lang = $lang()

    if (lang === "en") return "Hello"
    if (lang === "es") return "Hola"

    throw new Error ("No greeting found!")
  })
})

export const useGreeting$ = $(PLACE$)(($place) => {
  const $greet = getGreeting$ ()

  return View$ (() => {
    const greet = $greet()
    const place = $place()

    return (
      <article className="p-8 flex flex-col gap-4">
        <h1 className="text-2xl">{greet} {place}</h1>
      </article>
    )
  })
})
