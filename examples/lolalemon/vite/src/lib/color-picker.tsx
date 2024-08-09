import { use$, useDispatcherId$ } from "recon"
import { colors$, $Color, $Product } from "./product"
import { PropsOf, useState } from "@reconjs/utils-react"
import { Suspense } from "react"

function joins (delimeter: string, arr: Array <string|false|null|undefined>) {
  return arr.filter (x => x).join (delimeter)
} 

export function* colorState$ () {
  const id = yield* $Product()
  return use$ (() => {
    if (!id) throw new Error ("[colorState$] missing product ID!")
    const [ color, setColor ] = useState ("")
    return { color, setColor }
  })
}

function* swatchState$ () {
  const color = yield* $Color()
  const state = yield* use$ (colorState$)
  
  return use$ (() => {
    function onClick () {
      state.setColor (color)
    }
    
    return {
      isSelected: color === state.color,
      onClick,
    }
  })
}

function* colorInfo$ () {
  const id = yield* $Color()
  const colors = yield* use$ (colors$)
  return use$ (() => {
    if (!id) throw new Error ("[colorImage$] missing color ID!")
    const color = colors.find (c => c.id === id)
    if (!color) throw new Error ("[colorImage$] color not found!")
    return color
  })
}

function* Swatch$ (colorId: string) {
  yield $Color (() => colorId)
  const { isSelected, onClick } = yield* use$ (swatchState$)
  
  const color = yield* use$ (colorInfo$)
  
  const btn: PropsOf <"button"> = {
    type: "button",
    onClick,
    className: joins (" ", [
      "h-6 w-6 object-cover rounded-full",
      "ring-offset-2 cursor-pointer",
      isSelected && "ring-1 ring-slate-400",
      !isSelected && "ring-0 hover:ring-1 ring-slate-200",
    ])
  }
  
  const thumbnail: PropsOf <"img"> = {
    src: color.image,
    alt: color.name,
    className: "h-full w-full object-cover rounded-full",
  }
  
  return () => (
    <button {...btn}>
      <img {...thumbnail} />
    </button>
  )
}

function Swatch (props: {
  color: string,
}) {
  const Swatch = use$ (Swatch$, props.color)
  
  return (
    <li>
      <Swatch />
    </li>
  )
}

function* colorIds$ () {
  // TODO: Remove when figured out...
  const colors = yield* use$ (colors$)
  if (! Array.isArray (colors)) throw new Error ("Unexpected not an array")
  return colors.map (color => color.id)
}

export function* ColorPicker$ () {
  console.log ("ColorPicker$ dispatcher #1 =", useDispatcherId$())
  const ids = yield* use$ (colorIds$)
  console.log ("ColorPicker$ dispatcher #2 =", useDispatcherId$())
  
  return (props: PropsOf <"ul">) => (
    <ul className="w-full flex flex-row justify-center items-center gap-4">
      {ids.map (id => (
        <Suspense key={id}>
          <Swatch color={id} />
        </Suspense >
      ))}
    </ul>
  )
}