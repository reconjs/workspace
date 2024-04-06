"use server"

import "./import"

import { ACTION } from "@reconjs/next"

export default async function action (payload: any) {
  return await ACTION (payload)
}
