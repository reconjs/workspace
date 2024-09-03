import { use$, useDispatcherId$ } from "recon"
import { colors$, $Color } from "./product"
import { PropsOf, useState } from "@reconjs/utils-react"

function joins (delimeter: string, arr: Array <string|false|null|undefined>) {
  return arr.filter (x => x).join (delimeter)
} 

export function* colorState$ () {
  return use$ (() => {
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

function* Swatch$ (color: string) {
  yield $Color (() => color)
  const { isSelected, onClick } = yield* use$ (swatchState$)
  const props = {
    onClick,
    className: joins (" ", [
      "h-6 w-6 object-cover rounded-full",
      "ring-offset-2 cursor-pointer",
      isSelected && "ring-1 ring-slate-400",
      !isSelected && "ring-0 hover:ring-1 ring-slate-200",
    ])
  }
  
  
  return () => <button {...props} />
}

function Swatch (props: { color: string }) {
  return null
  const Swatch = use$ (Swatch$, props.color)
  
  return (
    <li>
      <Swatch />
    </li>
  )
}

function* colorIds$ () {
  const colors = yield* use$ (colors$)
  if (! Array.isArray (colors)) throw new Error ("Unexpected not an array")
  return colors.map (color => color.id)
}

export function* ColorPicker$ () {
  console.log ("ColorPicker$ dispatcher #1 =", useDispatcherId$())
  const ids = yield* use$ (colorIds$)
  console.log ("ColorPicker$ dispatcher #2 =", useDispatcherId$())
  
  return (props: PropsOf <"ul">) => (
    <ul>
      {ids.map (id => (
        <Swatch key={id} color={id} />
      ))}
    </ul>
  )
}