import {z} from "zod";

export const isAdminSchema = z.object({
    is_admin: z.string().optional().default('false').transform(Boolean),
})