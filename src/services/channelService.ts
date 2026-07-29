import {getSkip} from "../composables/useGetSkip.js";
import {db} from "../db.js";
import {videoForListSelect} from "../selects/videoForListSelect.js";

export const getChannelVideos = async (
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