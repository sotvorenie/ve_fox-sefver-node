import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";
import {formateVideos} from "@composables/useFormattedVideosInfo.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {channelException, duplicationSectionException} from "@utils/httpExceptions.js";
import {getUser} from "@utils/auth.js";

import {adminChannelRouter} from "@routes/channel/admin.js";
import {getChannelVideos} from "@routes/channel/services.js";
import {getChannelVideosQuerySchema, sectionNameSchema} from "@routes/channel/schemas.js";

import {channelIdSchema} from "@schemas/channelIdSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";
import {sectionIdSchema} from "@schemas/sectionIdSchema.js";

import {channelForListOrUserSelect} from "@selects/channelForListOrUserSelect.js";
import {videoForListSelect} from "@selects/videoForListSelect.js";

import {videosListResponse} from "@responses/videosListResponse.js";
import {isAdminSchema} from "@schemas/isAdminSchema.js";

export const channelRouter = Router();

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
    const { is_admin: isAdmin } = isAdminSchema.parse(req.query)
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
        (!isAdmin
                ? getChannelVideos(channelId, 1, 21, true, false, currentUserId)
                : Promise.resolve(null)
        ),
        (!isAdmin
                ? getChannelVideos(channelId, 1, 8, false, true, currentUserId)
                : Promise.resolve(null)
        )
    ])

    if (!channel) throw channelException

    res.json({
        channel,
        newVideos: newVideosData?.videos,
        popularVideos: popularVideosData?.videos,
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

    res.json({
        hasSections: count > 0
    })
}))

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

channelRouter.get('/section/:section_id/videos', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { section_id: sectionId } = sectionIdSchema.parse(req.params)
    const { page, limit } = pageLimitSchema.parse(req.query)
    const currentUserId = req.user?.id

    const skip: number = getSkip(page, limit)

    const [videos, total] = await Promise.all([
        db.video.findMany({
            where: {
                sectionId
            },
            skip,
            take: limit,
            select: videoForListSelect(currentUserId)
        }),
        db.video.count({where: {sectionId}})
    ])

    res.json({
        videos: formateVideos(videos),
        total,
        page,
        limit,
        hasMore: (skip + limit) < total,
    })
}))

channelRouter.post('/:channel_id/create_section', asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.params)
    const { section_name: sectionName } = sectionNameSchema.parse(req.body)

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

channelRouter.use('/admin', adminChannelRouter)