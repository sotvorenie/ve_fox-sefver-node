import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {videoException} from "@utils/httpExceptions.js";

import {videoIdSchema} from "@schemas/videoIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const addToWatchLater = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)

    const video = await db.video.findUnique({
        where: {
            id: videoId
        }
    })
    if (!video) throw videoException

    const existingWatchLater = await db.watchLater.findUnique({
        where: {
            userId_videoId: {
                userId: userId,
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
                userId: userId,
                videoId,
            }
        })
    }

    return successResponse(res)
}

export const deleteFromWatchLater = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)

    const video = await db.video.findUnique({
        where: {
            id: videoId
        }
    })
    if (!video) throw videoException

    await db.watchLater.delete({
        where: {
            userId_videoId: {
                userId: userId,
                videoId
            }
        }
    })

    return successResponse(res)
}