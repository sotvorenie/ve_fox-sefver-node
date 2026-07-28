import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {videoException} from "../utils/httpExceptions.js";
import {getAllVideos, modelMap} from "../services/getAllVideosService.js";

export const watchLaterRouter = Router();

const getWatchLaterQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
})
watchLaterRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getWatchLaterQuerySchema.parse(req.query)
    const currentUserId = req.user!.id

    const {videos, total, skip} = await getAllVideos(modelMap.watchLater, currentUserId, page, limit)

    res.json({
        videos,
        total,
        page,
        limit,
        has_more: (skip + limit) < total,
    })
}))

const setToWatchLaterParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
watchLaterRouter.post('/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = setToWatchLaterParamsSchema.parse(req.params)
    const currentUserId = req.user!.id

    const video = await db.video.findUnique({
        where: {
            id: videoId
        }
    })
    if (!video) throw videoException

    const existingWatchLater = await db.watchLater.findUnique({
        where: {
            userId_videoId: {
                userId: currentUserId,
                videoId
            }
        },
        select: {
            id: true,
        }
    })

    if (existingWatchLater) {
        await db.watchLater.update({
            where: {
                id: existingWatchLater.id
            },
            data: {
                date: new Date(),
            }
        })
    } else {
        await db.watchLater.create({
            data: {
                userId: currentUserId,
                videoId,
            }
        })
    }

    res.json({
        success: true,
    })
}))

const deleteFromWatchLaterParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
watchLaterRouter.delete('/delete/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = deleteFromWatchLaterParamsSchema.parse(req.params)
    const currentUserId = req.user!.id

    const video = await db.video.findUnique({
        where: {
            id: videoId
        }
    })
    if (!video) throw videoException

    await db.watchLater.delete({
        where: {
            userId_videoId: {
                userId: currentUserId,
                videoId
            }
        }
    })

    res.json({
        success: true,
    })
}))