"use client"

import Link from "next/link"
import { HeartIcon } from "@heroicons/react/24/outline"

export function HomeIcon () {
  return (
    <Link href="/">
      <HeartIcon className="stroke-red-500" height={30} width={30} />
    </Link>
  )
}
