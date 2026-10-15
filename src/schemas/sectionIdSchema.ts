import {z} from "zod";

export const sectionIdSchema = z.object({
    section_id: z.string().transform(Number),
})