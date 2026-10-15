import {z} from "zod";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

export const getChannelVideosQuerySchema = pageLimitSchema.extend({
    is_new: z.string().optional().default('true').transform(Boolean),
    is_popular: z.string().optional().default('false').transform(Boolean),
})

export const sectionNameSchema = z.object({
    section_name: z.string(),
})