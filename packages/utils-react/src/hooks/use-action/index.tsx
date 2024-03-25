"use client"

import { useEvent } from "../use-event"
import { useRaise } from "../use-raise"

type Vanc = (...args: any[]) => Promise <void>

export function useAction <T extends Vanc> (callback: T) {
  const raise = useRaise ()

  const res = useEvent ((...args) => {
    async function action () {
      try {
        await callback (...args)
      }
      catch (thrown) {
        raise (thrown)
      }
    }

    action()
  })

  return res as (...args: Parameters <T>) => void
}
