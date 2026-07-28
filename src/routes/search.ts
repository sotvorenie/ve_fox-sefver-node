import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";

export const searchRouter = Router();

const searchQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
    value: z.string(),
})
searchRouter.get('/', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, value } = searchQuerySchema.parse(req.query)
    const currentUserId = req.user?.id

    const skip: number = getSkip(page, limit)

    const words: string[] = value.split(/\s+/).map(w => w.trim()).filter(Boolean)

    if (words.length === 0) {
        return res.json({
            channels: [],
            videos: [],
            total: 0,
            page,
            limit,
            has_more: false,
        })
    }

    const channels = await db.channel.findMany({
        where: {
            OR: words.map(word => ({
                name: {
                    contains: word,
                    mode: 'insensitive'
                }
            }))
        },
        take: 3,
        select: {
            id: true,
            name: true,
            avatarUrl: true,
        }
    })

    const channelIds = channels.map(c => c.id)

    const videoConditions: any = words.map(word => ({
        OR: [
            {
                name: {
                    contains: word,
                    mode: 'insensitive',
                },
            },
            {
                tags: {
                    has: word,
                },
            },
        ],
    }))

    const whereClause: any = {
        OR: [
            ...videoConditions,
            ...(channelIds.length > 0 ? [{channelId: {in: channelIds}}] : [])
        ]
    }

    const [videos, total] = await Promise.all([
        db.video.findMany({
            where: whereClause,
            skip,
            take: limit,
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
                        userId: currentUserId ?? -1,
                    },
                    select: {
                        time: true,
                    }
                }
            }
        }),
        db.video.count({where: whereClause})
    ])

    const formattedVideos = videos.map(video => ({
        ...video,
        saved_time: video.savedTimes?.[0]?.time ?? null,
        savedTimes: undefined
    }))

    res.json({
        channels,
        videos: formattedVideos,
        total: total,
        page,
        limit,
        has_more: (skip + limit) < total,
    })
}))

const setToSearchHistoryBodySchema = z.object({
    search: z.string(),
})
searchRouter.post('/set_history', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { search } = setToSearchHistoryBodySchema.parse(req.body)
    const currentUser = req.user!

    const formattedSearch = search.trim()
    if (!formattedSearch?.length) {
        return res.json({
            success: false,
        })
    }

    let history: string[] = []
    if (currentUser?.search_history) {
        try {
            history = JSON.parse(currentUser.search_history)
        } catch {
            history = []
        }
    }

    history = history.filter(h => h !== formattedSearch)
    history = [formattedSearch, ...history].slice(0, 10)

    await db.user.update({
        where: {
            id: currentUser.id,
        },
        data: {
            searchHistory: JSON.stringify(history)
        }
    })

    res.json({
        success: true,
    })
}))

searchRouter.get('/get_history', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    const user = await db.user.findUnique({
        where: {
            id: currentUserId
        },
        select: {
            searchHistory: true
        }
    })

    let history: string[] = []
    if (user?.searchHistory) {
        try {
            history = JSON.parse(user.searchHistory)
        } catch {
            history = []
        }
    }

    res.json({
        search_history: history,
    })
}))

const deleteFromSearchHistoryBodySchema = z.object({
    search: z.string(),
})
searchRouter.delete('/delete_from_history', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { search } = deleteFromSearchHistoryBodySchema.parse(req.body)
    const currentUserId = req.user!.id

    const user = await db.user.findUnique({
        where: {
            id: currentUserId
        },
        select: {
            searchHistory: true,
        }
    })

    let history: string[] = []
    if (user?.searchHistory) {
        try {
            history = JSON.parse(user.searchHistory)
        } catch {
            history = []
        }
    }

    if (history.includes(search)) {
        history = history.filter(h => h !== search)
        await db.user.update({
            where: {
                id: currentUserId,
            },
            data: {
                searchHistory: JSON.stringify(history),
            }
        })
    }

    res.json({
        success: true,
    })
}))