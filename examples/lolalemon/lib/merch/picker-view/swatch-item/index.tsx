import { defineClientView, defineView, viaClientHooks } from "@reconjs/react"

import { Color, asaColor } from "../../models"
import { usingImageForColor, usingNameForColor } from "../../color/data"
import { usingColorSelector } from "../../product/selected"

const { useEffect } = viaClientHooks (() => import ("react"))

// defineClientView
export default defineView ((color: Color) => {
  const theColor = asaColor (color)
  const theName = usingNameForColor (theColor)
  const theImage = usingImageForColor (theColor)

  const theColorSelector = usingColorSelector ()

  return (props: {
    className?: string,
  }) => {
    const color = theColor ()
    const [ selected, setSelected ] = theColorSelector ()
    console.log ("theColorSelector", selected)

    useEffect (() => {
      console.log ("[swatch-item] rendered")
      return () => {
        console.log ("[swatch-item] unmounting...")
      }
    }, [])

    const isSelected = selected === color
    const onClick = () => { setSelected (color) }

    const alt = theName () ?? ""
    const src = theImage () ?? ""
  
    let className = "h-6 w-6 object-cover rounded-full" 
      + " ring-offset-2 cursor-pointer"
    
    if (isSelected) className += " ring-1 ring-slate-400"
    else className += " ring-0 hover:ring-1 ring-slate-200"

    if (props.className) className += " " + props.className
    
    // TODO: onClick in img
    return (
      <li className="p-1">
        <img {...{ className, alt, src, onClick }} />
      </li>
    )
  }
})
