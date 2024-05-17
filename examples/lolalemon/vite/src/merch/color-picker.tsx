import recon, { provide$ } from "@reconjs/core"
import { View$, use$, useList$ } from "@reconjs/react"
import { viaColorChoice$ } from "./color-choice"
import { forProductColors$, getColorImage$, getColorName$ } from "./server"
import { COLOR$, viaColor$ } from "./base"
import { PropsOf } from "@reconjs/utils-react"
import { Suspense } from "react"

const $ = recon ("@/merch/color-picker")

const join = (delimeter: string, chunks: any[]) => chunks
  .filter (x => typeof x === "string" || typeof x === "number")
  .join (delimeter)

function getClass (selected?: boolean, ...classes: string[]) {
  const ringClass = selected
    ? "ring-slate-400 ring-1"
    : "ring-slate-200 ring-0 hover:ring-1"

  return join (" ", [
    "h-6 w-6 object-cover rounded-full cursor-pointer ring-offset-2",
    ringClass,
    ...classes,
  ])
}

const useSwatch$ = $(() => {
  const _choice = viaColorChoice$()
  const useChoice = use$ (_choice)

  const $name = getColorName$()
  const $image = getColorImage$()

  type Props = {
    className?: string,
  }

  return View$ ((props: Props) => {
    const { isChosen, onChoose } = useChoice ()

    const name = $name()
    const image = $image()

    return (
      <li className="p-1">
        <img 
          className={getClass (isChosen, props.className ?? "")}
          alt={name}
          src={image}
          onClick={onChoose}
        />
      </li>
    )
  })
})

function Fallback (props: {
  className?: string,
}) {
  const className = getClass (false, props.className ?? "", "bg-blue-100")
  return <li className={className} />
}

// FIXME: This is a workaround
const usePickerItem$ = $(COLOR$) (($color) => {
  const _color = viaColor$()
  provide$ (_color, $color)
  const Swatch = useSwatch$()

  return View$ ((props: PropsOf <typeof Swatch>) => {
    return (
      <Suspense fallback={<Fallback />}>
        <Swatch {...props} />
      </Suspense>
    )
  })
})

export const useColorPicker$ = $(() => {
  const _colors = forProductColors$()
  
  const List = useList$ (_colors, ($color) => {
    return usePickerItem$ ($color)
  })

  type Props = {
    className?: string,
  }

  return View$ ((props: Props) => {
    return (
      <ul className="flex flex-row gap-2">
        <List {...props} />
      </ul>
    )
  })
})
