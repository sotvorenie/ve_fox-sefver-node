import { z } from 'zod';

export const videoIdSchema = z.object({
    video_id: z.string().transform(Number),
})