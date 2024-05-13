/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import "./import"

import { ReconRoot } from "@reconjs/react"
import { PropsOf } from "@reconjs/utils-react"

export default function Root (props: PropsOf <typeof ReconRoot>) {
  return <ReconRoot {...props} />
}
