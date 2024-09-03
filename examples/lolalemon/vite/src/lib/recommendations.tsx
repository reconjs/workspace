import { use$ } from "recon"
import { recommendations$ } from "./product"
import { ProductCard$ } from "./product-card"
import { Suspense } from "react"

function Card (props: {
  id: string,
}) {
  const ProductCard = use$ (ProductCard$, props.id)
  return (
    <Suspense>
      <ProductCard />
    </Suspense>
  )
}

export function* Recommendations$ () {
  const products = yield* use$ (recommendations$)
  console.log ("PRODUCTS", products)
  
  return (props: {}) => (
    <ul className="w-full flex flex-row items-center justify-between">
      {products.map (id => (
        <li key={id}>
          <Suspense>
            <Card key={id} id={id} />
          </Suspense>
        </li>
      ))}
    </ul>
  )
}