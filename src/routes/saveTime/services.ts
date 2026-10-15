import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {timeSchema} from "@routes/saveTime/schemas.js";

import {videoIdSchema} from "@schemas/videoIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const setVideoTime = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
    const { time } = timeSchema.parse(req.body)

    const savedEntry = await db.savedTime.findUnique({
        where: {
            userId_videoId: {
                userId: userId,
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
                userId: userId,
                videoId: videoId,
                time,
            }
        })
    }

    return successResponse(res)
}

export const deleteVideoTime = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)

    await db.savedTime.delete({
        where: {
            userId_videoId: {
                userId,
                videoId
            }
        }
    })

    return successResponse(res)
}