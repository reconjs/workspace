import { PropsWithChildren, Suspense } from "react"
import { ErrorBoundary } from "@reconjs/utils-react"
import { defineView } from "@reconjs/react"

import { usingSelectedColor } from "../product"
import { usingNameForColor } from "../color/data"
import { usingSwatchList } from "./swatch-list"

const usingTextView = defineView (() => {
  const theSelectedColor = usingSelectedColor ()
  const theName = usingNameForColor (theSelectedColor)

  return () => {
    const name = theName ()
    return <span>{name}</span>
  }
})

function TextFallback (props: PropsWithChildren <{}>) {
  return (
    <span className="w-20 h-full bg-slate-500">
      {props.children}
    </span>
  )
}

type PickerProps = {
  labeled?: boolean,
}

export default defineView (() => {
  const TextView = usingTextView ()
  const List = usingSwatchList ()

  return (props: PickerProps) => {
    console.log ("[usingPickerView]")

    const title = !props.labeled ? null : (
      <div className="flex flex-row gap-2">
        <span className="font-bold">Color:</span>
        <ErrorBoundary fallback={<TextFallback>Error</TextFallback>}>
          <Suspense fallback={<TextFallback />}>
            <TextView />
          </Suspense>
        </ErrorBoundary>
      </div>
    )

    return (
      <Suspense fallback={<>Loading...</>}>
        <div className="flex flex-col gap-1">
          {title}
          <ul className="flex flex-row gap-1">
            <List />
          </ul>
        </div>
      </Suspense>
    )
  }
})
