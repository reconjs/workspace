import { defineClientView } from "@reconjs/react"
import { RSC } from "@reconjs/utils-react"

export default defineClientView (() => {
  return () => {
    if (RSC) {
      throw new Error ("RSC ERROR")
    }

    return (
      <div className="static">
        <button className="h-10 w-10 rounded-full bg-red-500 text-white font-bold">
          C
        </button>
      </div>
    )
  }
})
