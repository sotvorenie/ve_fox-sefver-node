import {z} from "zod";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

export const getVideoCommentsQuerySchema = pageLimitSchema.extend({
    is_new: z.string().optional().default('true').transform(Boolean),
})

export const commentIdSchema = z.object({
    comment_id: z.string().transform(Number),
})

export const commentTextSchema = z.object({
    text: z.string(),
})

export const addCommentBodySchema = z.object({
    parent_id: z.union([z.string(), z.number()]).nullish().transform(val => val ? Number(val) : null)
}).extend(commentTextSchema.shape)