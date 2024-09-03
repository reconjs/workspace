export type Product = {
  id: string,
  slug: string,
  name: string,
  price: string,
  length: string,
  skus: string[],
}

export type ProductColor = {
  product: string,
  color: string,
  image: string,
}

export type Color = {
  id: string,
  name: string,
  image: string,
}
