import { z } from 'zod';

export const channelIdSchema = z.object({
    channel_id: z.string().transform(Number),
})