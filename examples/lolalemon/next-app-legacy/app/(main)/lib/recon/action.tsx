"use server"

import "./import"

import { ACTION } from "@reconjs/next"
import { timeout } from "@reconjs/utils"

export default async function action (payload: any) {
  await timeout (1000)
  return await ACTION (payload)
}
