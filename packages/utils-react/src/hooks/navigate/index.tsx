"use client"

import { 
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

const DEFAULT = () => {
  throw new Error ("RedirectContext was not provided")
}

const RedirectContext = createContext <
  (arg: string) => void
> (DEFAULT as any)

export const RedirectProvider = RedirectContext.Provider

export function useNavigate () {
  const redirect = useContext (RedirectContext)
  const [ nextUrl, setNextUrl ] = useState <string|null> (null)

  useEffect (() => {
    if (typeof nextUrl === "string") {
      redirect (nextUrl)
    }
  }, [ nextUrl ])

  return setNextUrl
}
