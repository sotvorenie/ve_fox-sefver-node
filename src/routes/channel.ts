import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {channelException, duplicationSectionException} from "../utils/httpExceptions.js";
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";

export const channelRouter = Router();

channelRouter.get('/all', asyncHandler(async (_: Request, res: Response) => {
    const [channels, total] = await Promise.all([
        db.channel.findMany({
            select: {
                id: true,
                name: true,
                avatarUrl: true,
            }
        }),
        db.channel.count()
    ])

    res.json({
        channels,
        total,
    })
}))

const getChannelParamsSchema = z.object({
    channel_id: z.string().transform(Number),
})
channelRouter.get('/:channel_id', asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = getChannelParamsSchema.parse(req.params)

    const channel = await db.channel.findUnique({
        where: {
            id: channelId
        },
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
        }
    })

    res.json(channel)
}))

const getChannelSectionsParamsSchema = z.object({
    channel_id: z.string().transform(Number),
})
channelRouter.get('/:channel_id/sections', asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = getChannelSectionsParamsSchema.parse(req.params)

    const [sections, total] = await Promise.all([
        db.channelSection.findMany({
            where: {channelId},
            select: {
                id: true,
                name: true,
                channelId: true,
            }
        }),
        db.channelSection.count({
            where: {channelId}
        }),
    ])

    res.json({
        sections,
        total,
    })
}))

const checkChannelHasSectionsParamsSchema = z.object({
    channel_id: z.string().transform(Number),
})
channelRouter.get('/:channel_id/has_sections', asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = checkChannelHasSectionsParamsSchema.parse(req.params)

    const count = await db.channelSection.count({
        where: {channelId},
        take: 1,
    })

    res.json({
        success: count > 0,
    })
}))

const getChannelVideosParamsSchema = z.object({
    channel_id: z.string().transform(Number),
})
const getChannelVideosQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
    is_new: z.string().optional().default('true').transform(Boolean),
    is_popular: z.string().optional().default('false').transform(Boolean),
})
channelRouter.get('/:channel_id/videos', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = getChannelVideosParamsSchema.parse(req.params)
    const { page, limit, is_new: isNew, is_popular: isPopular } = getChannelVideosQuerySchema.parse(req.query)
    const currentUserId = req.user?.id

    const channel = await db.channel.findUnique({where: {id: channelId}})

    if (!channel) throw channelException

    const skip: number = getSkip(page, limit)

    let orderBy: any = {date: 'asc'}
    if (isNew) {
        orderBy = {date: 'desc'}
    } else if (isPopular) {
        orderBy = {views: 'desc'}
    }

    const [videos, total] = await Promise.all([
        db.video.findMany({
            where: {channelId},
            skip,
            take: limit,
            orderBy,
            select: {
                id: true,
                name: true,
                createdAt: true,
                duration: true,
                viewsCount: true,
                url: true,
                channel: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                },
                previewUrl: true,
                savedTimes: {
                    where: {
                        userId: currentUserId ?? -1
                    },
                    select: {
                        time: true
                    }
                }
            }
        }),
        db.video.count({where: {channelId}})
    ])

    const formattedVideos = videos.map((video: any) => ({
        ...video,
        saved_time: video.savedTimes?.length ? video.savedTimes[0].time : null,
        savedTimes: undefined
    }))

    res.json({
        videos: formattedVideos,
        total,
        page,
        limit,
        has_more: (skip + limit) < total,
    })
}))

const createChannelSectionParamsSchema = z.object({
    channel_id: z.string().transform(Number),
})
const createChannelSectionBodySchema = z.object({
    section_name: z.string(),
})
channelRouter.post('/:channel_id/create_section', asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = createChannelSectionParamsSchema.parse(req.params)
    const { section_name: sectionName } = createChannelSectionBodySchema.parse(req.body)

    const hasSectionWithThisName = await db.channelSection.count({
        where: {
            channelId,
            name: sectionName
        }
    }) > 0

    if (hasSectionWithThisName) throw duplicationSectionException

    const newSection = await db.channelSection.create({
        data: {
            name: sectionName,
            channelId,
        },
        select: {
            id: true,
            name: true,
            channelId: true,
        }
    })

    res.status(201).json(newSection)
}))