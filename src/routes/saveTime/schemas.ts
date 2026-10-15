import {z} from "zod";

export const timeSchema = z.object({
    time: z.string().transform(Number),
})