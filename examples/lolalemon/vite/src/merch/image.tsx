import recon from "@reconjs/core"
import { View$ } from "@reconjs/react"
import { getProductImage$ } from "./server"
import { getChosenColor$ } from "./color-choice"

const $ = recon ("@/merch/image")

export const useProductImage$ = $(() => {
  // const $color = getChosenColor$()
  // const StarButton = useStarButton$()

  const $color = getChosenColor$()
  const $image = getProductImage$ ($color)

  return View$ ((props: { className?: string }) => {
    const src = $image ()

    let className = "w-full h-full object-cover aspect-[10/12]"
    if (props.className) className += " " + props.className

    if (!src) {
      console.warn ("[usingProductImage] No image src")
      return null
    }

    // const fallback = <StarButtonFallback className="absolute -mt-8 ml-2" />
    
    return <>
      <div className="w-full h-full">
        <img {...{ className, src }} loading="lazy" alt="product image" />
        {/*}
        <ErrorBoundary>
          <Suspense fallback={fallback}>
            <StarButton className="absolute -mt-8 ml-2" />
          </Suspense>
        </ErrorBoundary>
        {*/}
      </div>
    </>
  })
})
