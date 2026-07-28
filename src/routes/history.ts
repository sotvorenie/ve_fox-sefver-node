import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";
import {videoException} from "../utils/httpExceptions.js";

export const historyRouter = Router();

const setToHistoryParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
historyRouter.post('/set/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = setToHistoryParamsSchema.parse(req.params)
    const currentUserId = req.user!.id

    const video = await db.video.findUnique({where: {id: videoId}})
    if (!video) throw videoException

    const historyEntry = await db.history.findUnique({
        where: {
            userId_videoId: {
                userId: currentUserId,
                videoId
            }
        }
    })

    if (historyEntry) {
        await db.history.update({
            where: {
                id: historyEntry.id
            },
            data: {
                date: new Date(),
            }
        })
    } else {
        await db.history.create({
            data: {
                userId: currentUserId,
                videoId,
            }
        })

        const total = await db.history.count({where: {userId: currentUserId}})
        if (total > 100) {
            const oldestHistoryItem = await db.history.findFirst({
                where: {
                    userId: currentUserId,
                },
                orderBy: {date: 'asc'},
                select: {
                    id: true,
                }
            })
            if (oldestHistoryItem) {
                await db.history.delete({
                    where: {
                        id: oldestHistoryItem.id
                    }
                })
            }
        }
    }

    res.json({
        success: true,
    })
}))

const getHistoryQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
})
historyRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getHistoryQuerySchema.parse(req.query)
    const currentUserId = req.user!.id

    const skip: number = getSkip(page, limit)

    const [historyItems, total] = await Promise.all([
        db.history.findMany({
            where: {
                userId: currentUserId,
            },
            orderBy: {date: 'desc'},
            skip,
            take: limit,
            select: {
                video: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        duration: true,
                        viewsCount: true,
                        url: true,
                        previewUrl: true,
                        channel: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            }
                        },
                        savedTimes: {
                            where: {
                                userId: currentUserId,
                            },
                            select: {
                                time: true,
                            }
                        }
                    }
                }
            }
        }),
        db.history.count({where: {userId: currentUserId}})
    ])

    const formattedVideos = historyItems.map(item => {
        const video = item.video
        return {
            ...video,
            saved_time: video.savedTimes?.[0]?.time ?? null,
            savedTimes: undefined
        }
    })

    res.json({
        videos: formattedVideos,
        total,
        page,
        limit,
        has_more: (skip + limit) < total,
    })
}))