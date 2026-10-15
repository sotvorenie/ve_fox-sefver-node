import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getUser} from "@utils/auth.js";

import {valueSchema} from "@routes/search/schemas.js";

import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

import {videoForListSelect} from "@selects/videoForListSelect.js";

import {deleteFromSearchHistory, getSearchHistory, setToSearchHistory} from "@routes/search/services.js";

export const searchRouter = Router();

searchRouter.get('/', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, value } = pageLimitSchema.extend(valueSchema.shape).parse(req.query)
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
            select: videoForListSelect(currentUserId)
        }),
        db.video.count({where: whereClause})
    ])

    const formattedVideos = videos.map(video => ({
        ...video,
        savedTime: video.savedTimes?.[0]?.time ?? null,
        savedTimes: undefined
    }))

    res.json({
        channels,
        videos: formattedVideos,
        total: total,
        page,
        limit,
        hasMore: (skip + limit) < total,
    })
}))

searchRouter.get('/get_history', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await getSearchHistory(res, currentUserId)
}))

searchRouter.post('/set_history', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await setToSearchHistory(req, res, currentUserId)
}))

searchRouter.delete('/delete_from_history', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await deleteFromSearchHistory(req, res, currentUserId)
}))