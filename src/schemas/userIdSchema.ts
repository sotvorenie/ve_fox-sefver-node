import {z} from "zod";

export const userIdSchema = z.object({
    user_id: z.string().transform(Number),
})