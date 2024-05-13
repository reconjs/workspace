import { Model, defineModel } from "@reconjs/core"

class Content extends Model <string> {}

export type { Content }

export const asaContent = defineModel (Content)
