import { type Request, type Response } from 'express';
import {db} from "../db.js";

import {getSkip} from "../composables/useGetSkip.js";
import {videoForListSelect} from "../selects/videoForListSelect.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";

export const modelMap = {
    watchLater: db.watchLater,
    like: db.like,
    history: db.history,
}

export const getAllVideos = async (
    req: Request,
    res: Response,
    model: any,
) => {
    const { page, limit } = pageLimitSchema.parse(req.query)
    const currentUserId = req.user!.id
    
    const skip: number = getSkip(page, limit)

    const [videoItems, total] = await Promise.all([
       model.findMany({
            where: {
                userId: currentUserId,
            },
            orderBy: {date: 'desc'},
            skip,
            take: limit,
            select: {
                video: {
                    select: videoForListSelect(currentUserId)
                }
            }
        }),
        model.count({where: {userId: currentUserId}})
    ])

    const formattedVideos = videoItems.map((item: any) => {
        const video = item.video
        return {
            ...video,
            savedTime: video.savedTimes?.[0]?.time ?? null,
            savedTimes: undefined
        }
    })

    res.json({
        videos: formattedVideos,
        total,
        page,
        limit,
        hasMore: (skip + limit) < total,
    })
}