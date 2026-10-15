import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";
import {formateVideos} from "@composables/useFormattedVideosInfo.js";

import {videoForListSelect} from "@selects/videoForListSelect.js";
import {channelIdSchema} from "@schemas/channelIdSchema.js";
import {channelForListOrUserSelect} from "@selects/channelForListOrUserSelect.js";
import {channelException} from "@utils/httpExceptions.js";

export const getChannelVideos = async (
    channelId:number,
    page: number = 1,
    limit: number = 21,
    isNew: boolean = true,
    isPopular: boolean = false,
    currentUserId?:number
) => {
    const skip: number = getSkip(page, limit)

    let orderBy: any = {createdAt: 'asc'}
    if (isNew) {
        orderBy = {createdAt: 'desc'}
    } else if (isPopular) {
        orderBy = {viewsCount: 'desc'}
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

    return {
        videos: formateVideos(videos),
        total,
        page,
        limit,
        hasMore: (skip + limit) < total,
    }
}

export const getChannel = async (
    req: Request,
    res: Response,
    isAdmin?: boolean
) => {
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
}