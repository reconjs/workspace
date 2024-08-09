import { use$ } from "recon"
import { $Product, product$, image$ } from "./product"
import { PropsOf } from "@reconjs/utils-react"
import { ColorPicker$ } from "./color-picker"
import { Suspense } from "react"

export function* ProductImage$ () {
  console.log ("Product Card!", yield* $Product())
  const image = yield* use$ (image$)
  return (props: PropsOf<"img">) => (
    <img {...props} src={image} alt="product" />
  )
}

function ProductImage (props: PropsOf <"img">) {
  const ProdImage = use$ (ProductImage$)
  return (
    <Suspense>
      <ProdImage {...props} />
    </Suspense>
  )
}

function* WrappedImage$ () {
  return (props: PropsOf <"img">) => (
    <ProductImage className="rounded-t-xl w-60" />
  )
}

export function* ProductCard$ (id: string) {
  console.log ("Product Card!", id)
  
  yield $Product (() => id)
  const ProductImage = use$ (WrappedImage$)
  const ColorPicker = use$ (ColorPicker$)
  const { name, slug, price } = yield* use$ (product$)
    
  const link = {
    className: "text-lg font-bold",
    href: `/product/${slug}`,
  }
  
  const bottomClass = "border rounded-b-xl border-t-0"
    + " flex flex-col justify-between items-start"
    + " w-full h-32 p-4"
  
  return () => (
    <div className="rounded-xl">
      <Suspense>
        <ProductImage className="rounded-t-xl w-60" />
      </Suspense>
      <div className={bottomClass}>
        <Suspense>
          <ColorPicker />
        </Suspense>
        <div>
          <a {...link}>{name}</a>
          <p>{price}</p>
        </div>
      </div>
    </div>
  )
}