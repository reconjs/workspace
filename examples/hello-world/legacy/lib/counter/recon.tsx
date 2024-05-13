import { defineView } from "@reconjs/react"
import { usingCountStore } from "../count"
import { usingIncrementerView } from "../incrementer"

export default defineView (() => {
  const theCountStore = usingCountStore ()
  const Incrementer = usingIncrementerView ()

  return () => {
    const [ count ] = theCountStore ()
    return (
      <div className="flex flex-row gap-4">
        Count: 
        <div className="w-4 text-right">{count}</div>
        <Incrementer />
      </div>
    )
  }
})
