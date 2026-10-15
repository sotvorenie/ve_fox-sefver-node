import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";
import {formateVideos} from "@composables/useFormattedVideosInfo.js";

import {videoForListSelect} from "@selects/videoForListSelect.js";

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