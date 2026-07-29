import { Router, type Request, type Response } from 'express';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {videoException} from "../utils/httpExceptions.js";
import {getAllVideos, modelMap} from "../services/getAllVideosService.js";
import {videosListResponse} from "../responses/videosListResponse.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {videoIdSchema} from "../schemas/videoIdSchema.js";

export const likesRouter = Router();

likesRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = pageLimitSchema.parse(req.query)
    const currentUserId = req.user!.id

    const {videos, total} = await getAllVideos(modelMap.like, currentUserId, page, limit)

    return videosListResponse(res, videos, total, page, limit )
}))

likesRouter.post('/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
    const currentUserId = req.user!.id

    const video = await db.video.findUnique({where: {id: videoId}})
    if (!video) throw videoException

    const existingLike = await db.like.findUnique({
        where: {
            userId_videoId: {
                userId: currentUserId,
                videoId
            }
        }
    })

    let isLiked = false

    await db.$transaction(async (tx) => {
        if (existingLike) {
            await tx.like.delete({
                where: {
                    userId_videoId: {
                        userId: currentUserId,
                        videoId
                    }
                }
            })
            await tx.video.update({
                where: {
                    id: videoId,
                },
                data: {
                    likesCount: {decrement: 1}
                }
            })
        } else {
            await tx.like.create({
                data: {
                    userId: currentUserId,
                    videoId,
                }
            })
            await tx.video.update({
                where: {
                    id: videoId,
                },
                data: {
                    likesCount: {increment: 1}
                }
            })
            isLiked = true
        }
    })

    res.json({
        is_liked: isLiked
    })
}))