import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";

export const saveTimesRouter = Router();

const setToSaveTimeParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
const setToSaveTimeBodySchema = z.object({
    time: z.string().transform(Number),
})
saveTimesRouter.post('/set/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = setToSaveTimeParamsSchema.parse(req.params)
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

    res.json({
        success: true,
    })
}))

const deleteSaveTimeParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
saveTimesRouter.delete('/delete/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = deleteSaveTimeParamsSchema.parse(req.params)
    const currentUserId = req.user!.id

    await db.savedTime.delete({
        where: {
            userId_videoId: {
                userId: currentUserId,
                videoId: videoId
            }
        }
    })

    res.json({
        success: true,
    })
}))

const getSaveTimeParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
saveTimesRouter.get('/get/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = getSaveTimeParamsSchema.parse(req.params)
    const currentUserId = req.user!.id

    const savedTime = await db.savedTime.findUnique({
        where: {
            userId_videoId: {
                userId: currentUserId,
                videoId
            }
        },
        select: {
            time: true,
        }
    })

    res.json({
        time: savedTime?.time ?? null
    })
}))