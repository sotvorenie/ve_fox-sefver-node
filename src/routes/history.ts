import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";

export const historyRouter = Router();

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