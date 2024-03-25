"use client"

import { useHeader } from "./use"
import { PropsOf } from "@reconjs/utils-react"

type Props = PropsOf <ReturnType <typeof useHeader>>

export function Header (props: Props) {
	const View = useHeader ()
  return <View {...props} />
}
