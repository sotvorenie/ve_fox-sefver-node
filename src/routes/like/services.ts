import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {videoException} from "@utils/httpExceptions.js";

import {videoIdSchema} from "@schemas/videoIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const likeVideo = async (
    req: Request, 
    res: Response,
    userId: number,
) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
    
    const video = await db.video.findUnique({where: {id: videoId}})
    if (!video) throw videoException

    const existingLike = await db.like.findUnique({
        where: {
            userId_videoId: {
                userId: userId,
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
                        userId: userId,
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
                    userId: userId,
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

    successResponse(res)
}