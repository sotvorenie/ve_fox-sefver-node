import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {videoException} from "../utils/httpExceptions.js";
import {getAllVideos, modelMap} from "../services/getAllVideosService.js";

export const likesRouter = Router();

const getLikesQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
})
likesRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getLikesQuerySchema.parse(req.query)
    const currentUserId = req.user!.id

    const {videos, total, skip} = await getAllVideos(modelMap.like, currentUserId, page, limit)

    res.json({
        videos,
        total,
        page,
        limit,
        has_more: (skip + limit) < total,
    })
}))

const likeParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
likesRouter.post('/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = likeParamsSchema.parse(req.params)
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