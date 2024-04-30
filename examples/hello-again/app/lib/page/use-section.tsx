import recon, { get$, Model$, provide$, Scope$, Value$ } from "@reconjs/core"
import { View$ } from "@reconjs/react"

// import { getGreeting$ } from "../greeting"
// import { useCounter$ } from "@/lib/counter"

const $ = recon ("@/app/lib/page/use-section")

const LANG$ = $(class Language extends String {})

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

export const viaLanguage$ = $(() => {
  const $lang = getEnglish$()
  return Scope$ ($lang)
})

const getGreeting$ = $(LANG$)($lang => {
  /*
  console.group ("viaLanguage$()")
  const $Lang = viaLanguage$ ()
  console.groupEnd ()

  console.group ("get$ ($Lang)")
  const $lang = get$ ($Lang)
  console.groupEnd()
  */

  return Value$ (() => {
    const lang = $lang()

    if (lang === "en") return "Hello World"
    if (lang === "es") return "Hola Mundo"

    return "Oh no! Something went wrong"
  })
})

const useGreeting$ = $(LANG$)($lang => {
  console.group ("getGreeting$()", $lang)
  const $greeting = getGreeting$ ($lang)
  console.groupEnd()

  return View$ (() => {
    const text = $greeting()

    return (
      <h1 className="text-2xl">{text}</h1>
    )
  })
})

const Counter = () => null

export const useSection$ = $(() => {
  const $english = getEnglish$()
  const Greeting = useGreeting$ ($english)
  // const Counter = useCounter$()

  return View$ (() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <Greeting />
      </article>
    )
  })
})

export const useSpanishSection$ = $(() => {
  const $spanish = getSpanish$()
  /*
  const $Lang = viaLanguage$()
  provide$ ($Lang, $spanish)
  */

  const Greeting = useGreeting$ ($spanish)
  // const Counter = useCounter$()

  return View$ (() => {
    return (
      <article className="p-8 flex flex-col gap-4">
        <Greeting />
      </article>
    )
  })
})
