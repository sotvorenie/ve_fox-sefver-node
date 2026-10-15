import {z} from "zod";

export const seedSchema = z.object({
    seed: z.string()
})

export const pathSchema = z.object({
    path: z.string()
})

export const viewsSchema = z.object({
    views: z.string().transform(Number)
})

export const sectionIndexSchema = z.object({
    section_index: z.string().transform(Number),
})