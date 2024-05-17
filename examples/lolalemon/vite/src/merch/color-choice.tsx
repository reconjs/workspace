import recon, { Model$, get$ } from "@reconjs/core"
import { Hook$, use$ } from "@reconjs/react"
import { COLOR$, viaColor$ } from "./base"
import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { getProductDefaultColor$ } from "./server"

const $ = recon ("@/merch/color-choice")

export const viaChoice$ = $(() => {
  const $color = getProductDefaultColor$()

  return Hook$ (() => {
    const [ chosenColor, setColor ] = useState (() => $color())

    const id = useId()
    useEffect (() => {
      console.log ("viaChoice!", id)
    }, [])

    function setChosenColor (nextColor: string) {
      console.log ("setChosenColor", nextColor)
      setColor (nextColor)
    }

    return { chosenColor, setChosenColor }
  })
})

export const getChosenColor$ = $(() => {
  const _choice = viaChoice$ ()
  const $choice = get$ (_choice)

  return Model$ (COLOR$, () => {
    const { chosenColor } = $choice()
    return chosenColor
  })
})

export const viaColorChoice$ = $(() => {
  const _choice = viaChoice$()
  const useChoice = use$ (_choice)

  const _color = viaColor$()
  const $color = get$ (_color)

  return Hook$ (() => {
    const color = $color()
    const { chosenColor, setChosenColor } = useChoice ()

    const isChosen = useMemo (() => {
      return color === chosenColor
    }, [ color, chosenColor ])

    const onChoose = useCallback (() => {
      console.log ("[onChoose]", { color, chosenColor })
      setChosenColor (color)
    }, [ color, chosenColor, setChosenColor ])

    return { isChosen, onChoose }
  })
})
