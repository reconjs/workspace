import { defineClientView } from "@reconjs/react"
import { usingCountStore } from "../count"
import { PropsOf } from "@reconjs/utils-react"

export const usingIncrementerView = defineClientView (() => {
  const theCountStore = usingCountStore ()

  return () => {
    const [ count, setCount ] = theCountStore ()

    const btn: PropsOf<"button"> = {
      type: "button",
      className: "justify-center items-center w-6 h-6 bg-blue-500 text-white rounded-lg",
    }

    btn.onClick = () => {
      setCount (count + 1)
    }

    return <button {...btn}>+</button>
  }
})
