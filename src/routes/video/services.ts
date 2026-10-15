import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {videoIdSchema} from "@schemas/videoIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const addVideoToHistory = async (
    userId: number,
    videoId: number
) => {
    const historyEntry = await db.history.findUnique({
        where: { userId_videoId: { userId, videoId } }
    })

    if (historyEntry) {
        await db.history.update({
            where: { id: historyEntry.id },
            data: { date: new Date() }
        })
    } else {
        await db.history.create({
            data: { userId, videoId }
        })

        const total = await db.history.count({ where: { userId } })
        if (total > 100) {
            const oldest = await db.history.findFirst({
                where: { userId },
                orderBy: { date: 'asc' },
                select: { id: true }
            })
            if (oldest) {
                await db.history.delete({ where: { id: oldest.id } })
            }
        }
    }
}

export const updateVideo = async (
    req: Request,
    res: Response,
    data: any
) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)

    await db.video.update({
        where: {
            id: videoId
        },
        data
    })

    successResponse(res)
}