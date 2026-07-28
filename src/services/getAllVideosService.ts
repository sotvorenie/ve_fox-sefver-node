import {getSkip} from "../composables/useGetSkip.js";
import {db} from "../db.js";

export const modelMap = {
    watchLater: db.watchLater,
    like: db.like,
    history: db.history,
}

export const getAllVideos = async (
    model: any,
    userId: number,
    page: number = 1,
    limit: number = 21,
) => {
    const skip: number = getSkip(page, limit)

    const [watchLaterItems, total] = await Promise.all([
       model.findMany({
            where: {
                userId: userId,
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
                                userId: userId,
                            },
                            select: {
                                time: true,
                            }
                        }
                    }
                }
            }
        }),
        model.count({where: {userId: userId}})
    ])

    const formattedVideos = watchLaterItems.map((item: any) => {
        const video = item.video
        return {
            ...video,
            saved_time: video.savedTimes?.[0]?.time ?? null,
            savedTimes: undefined
        }
    })

    return {
        videos: formattedVideos,
        total,
        skip
    }
}