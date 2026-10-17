import {z} from "zod";

export const loginPasswordSchema = z.object({
    login: z.string(),
    password: z.string(),
})