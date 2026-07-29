import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {videoIdSchema} from "../schemas/videoIdSchema.js";
import {successResponse} from "../responses/successResponse.js";

export const saveTimesRouter = Router();

const setToSaveTimeBodySchema = z.object({
    time: z.string().transform(Number),
})
saveTimesRouter.post('/set/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
    const { time } = setToSaveTimeBodySchema.parse(req.body)
    const currentUserId = req.user!.id

    const savedEntry = await db.savedTime.findUnique({
        where: {
            userId_videoId: {
                userId: currentUserId,
                videoId
            }
        }
    })

    if (savedEntry) {
        await db.savedTime.update({
            where: {
                id: savedEntry.id
            },
            data: {
                time,
            }
        })
    } else {
        await db.savedTime.create({
            data: {
                userId: currentUserId,
                videoId: videoId,
                time,
            }
        })
    }

    return successResponse(res)
}))

saveTimesRouter.delete('/delete/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
    const currentUserId = req.user!.id

    await db.savedTime.delete({
        where: {
            userId_videoId: {
                userId: currentUserId,
                videoId: videoId
            }
        }
    })

    return successResponse(res)
}))