import {z} from "zod";

export const uploadVideoSchema = z.object({
    title: z.string().min(1),
    channel_id: z.string().transform(Number),
    section_id: z.string().optional().transform((val: any) => val ? Number(val) : null),
    tags: z.string().optional().transform((val: any) => {
        if (!val) return []
        return val.split(',').map((t: string) => t.trim()).filter(Boolean)
    })
})