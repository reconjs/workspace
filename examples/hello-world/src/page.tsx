import { use, useState } from "react"
import { atomic } from "recon"

const useGreetingAtom = atomic (async () => {
  return "Hello"
})

const useAudienceAtom = atomic (() => {
  const [ audience, setAudience ] = useState ("World")
  return { audience, setAudience }
})

export function Page () {
  const _greeting = useGreetingAtom()
  const _audience = useAudienceAtom()

  const greeting = use (_greeting)
  const { audience } = use (_audience)

  // Hello World
  return <h1>{greeting} {audience}</h1>
}