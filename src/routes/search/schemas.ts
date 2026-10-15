import {z} from "zod";

export const valueSchema = z.object({
    value: z.string()
})