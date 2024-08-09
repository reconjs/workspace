import { use$ } from "recon"
import { $Product, product$, image$ } from "./product"
import { PropsOf } from "@reconjs/utils-react"
import { ColorPicker$ } from "./color-picker"

export function* ProductImage$ () {
  const image = yield* use$ (image$)
  return (props: PropsOf<"img">) => <img {...props} src={image} alt="product" />
}

export function* ProductCard$ (id: string) {
  yield $Product (() => id)
  const ProductImage = use$ (ProductImage$)
  const ColorPicker = use$ (ColorPicker$)
  const { name, slug, price } = yield* use$ (product$)
    
  const link = {
    className: "text-lg font-bold",
    href: `/product/${slug}`,
  }
  
  const bottomClass = "border rounded-b-xl border-t-0 h-20 p-4"
    + " flex flex-col justify-between items-start"
  
  return () => (
    <div className="rounded-xl">
      <ProductImage className="rounded-t-xl w-60" />
      <div className={bottomClass}>
        <ColorPicker />
        <a {...link}>{name}</a>
        <p>{price}</p>
      </div>
    </div>
  )
}