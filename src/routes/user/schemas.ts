import {z} from "zod";

export const passwordSchema = z.object({
    password: z.string(),
})

export const routerMapSchema = z.object({
    router_map: z.string(),
})