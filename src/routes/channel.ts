import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {channelException, duplicationSectionException} from "../utils/httpExceptions.js";
import {getUser} from "../utils/auth.js";
import {channelForListOrUserSelect} from "../selects/channelForListOrUserSelect.js";
import {channelIdSchema} from "../schemas/channelIdSchema.js";
import {videosListResponse} from "../responses/videosListResponse.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {successResponse} from "../responses/successResponse.js";
import {getSkip} from "../composables/useGetSkip.js";
import {videoForListSelect} from "../selects/videoForListSelect.js";

export const channelRouter = Router();

const getChannelVideos = async (
    channelId:number,
    page: number = 1,
    limit: number = 21,
    isNew: boolean = true,
    isPopular: boolean = false,
    currentUserId?:number
) => {
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
            select: videoForListSelect(currentUserId)
        }),
        db.video.count({where: {channelId}})
    ])

    const formattedVideos = videos.map((video: any) => ({
        ...video,
        saved_time: video.savedTimes?.[0]?.time ?? null,
        savedTimes: undefined
    }))

    return {
        videos: formattedVideos,
        total
    }
}

channelRouter.get('/all', asyncHandler(async (_: Request, res: Response) => {
    const [channels, total] = await Promise.all([
        db.channel.findMany({
            select: channelForListOrUserSelect
        }),
        db.channel.count()
    ])

    res.json({
        channels,
        total,
    })
}))

channelRouter.get('/:channel_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.params)
    const currentUserId = req.user?.id

    const [channel, newVideosData, popularVideosData] = await Promise.all([
        db.channel.findUnique({
            where: {
                id: channelId
            },
            select: {
                ...channelForListOrUserSelect,
                createdAt: true,
            }
        }),
        getChannelVideos(channelId, 1, 8, true, false, currentUserId),
        getChannelVideos(channelId, 1, 8, false, true, currentUserId)
    ])

    if (!channel) throw channelException

    res.json({
        channel,
        new_videos: newVideosData.videos,
        popular_videos: popularVideosData.videos,
    })
}))

channelRouter.get('/:channel_id/sections', asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.params)

    const [sections, total] = await Promise.all([
        db.channelSection.findMany({
            where: {channelId},
            select: channelForListOrUserSelect
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

channelRouter.get('/:channel_id/has_sections', asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.params)

    const count = await db.channelSection.count({
        where: {channelId},
        take: 1,
    })

    return successResponse(res, count > 0)
}))

const getChannelVideosQuerySchema = pageLimitSchema.extend({
    is_new: z.string().optional().default('true').transform(Boolean),
    is_popular: z.string().optional().default('false').transform(Boolean),
})
channelRouter.get('/:channel_id/videos', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.params)
    const { page, limit, is_new: isNew, is_popular: isPopular} = getChannelVideosQuerySchema.parse(req.query)
    const currentUserId = req.user?.id

    const channel = await db.channel.findUnique({where: {id: channelId}})
    if (!channel) throw channelException

    const {videos, total} = await getChannelVideos(
        channelId,
        page,
        limit,
        isNew,
        isPopular,
        currentUserId
    )

    return videosListResponse(res, videos, total, page, limit)
}))

const createChannelSectionBodySchema = z.object({
    section_name: z.string(),
})
channelRouter.post('/:channel_id/create_section', asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.params)
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