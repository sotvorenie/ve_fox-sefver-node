import { Router, type Request, type Response } from 'express';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {videoException} from "../utils/httpExceptions.js";
import {getAllVideos, modelMap} from "../services/getAllVideosService.js";
import {videoIdSchema} from "../schemas/videoIdSchema.js";
import {successResponse} from "../responses/successResponse.js";

export const watchLaterRouter = Router();

watchLaterRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    await getAllVideos(req, res, modelMap.watchLater)
}))

watchLaterRouter.post('/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
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

    return successResponse(res)
}))

watchLaterRouter.delete('/delete/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
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

    return successResponse(res)
}))