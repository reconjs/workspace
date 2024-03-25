import { useEffect, useRef, useState } from "react"

export function useMounted () {
  const [ mounted, setMounted ] = useState (() => false)

  useEffect (() => {
    if (!mounted) {
      setMounted (true)
      return
    }

    return () => {
      setMounted (false)
    }
  }, [])

  return mounted
}

export const useUpdateEffect: typeof useEffect = (factory, deps) => {
  const mounted = useMounted()
  
  useEffect (() => {
    if (!mounted) return
    return factory()
  }, deps)
}
