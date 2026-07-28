import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";
import {videoException} from "../utils/httpExceptions.js";
import {addVideoToHistory} from "../services/historyService.js";

export const videosRouter = Router();

const getAllVideosQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
    seed: z.string().optional().default('0.5').transform(Number),
})
videosRouter.get('/all', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, seed } = getAllVideosQuerySchema.parse(req.query)
    const currentUserId = req.user?.id

    const skip: number = getSkip(page, limit)

    const [_, randomRowsResult] = await db.$transaction([
        db.$executeRaw`SELECT setseed(${seed})`,
        db.$queryRaw`SELECT id FROM "Video" ORDER BY RANDOM() LIMIT ${limit} OFFSET ${skip}`
    ]) as [unknown, { id: number }[]]
    const randomIds = randomRowsResult.map(r => r.id)
    if (randomIds.length === 0) {
        return res.json({
            videos: [],
            total: 0,
            page,
            limit,
            has_more: false,
        })
    }

    const [videosFromDB, total] = await Promise.all([
        db.video.findMany({
            where: {
                id: {in: randomIds}
            },
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
        db.video.count()
    ])

    const map = new Map(videosFromDB.map(v => [v.id, v]))
    const videos = randomIds.map(id => map.get(id)).filter(Boolean)

    const formattedVideos = videos.map(video => ({
        ...video,
        saved_time: video?.savedTimes?.[0]?.time ?? null,
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

const getAllVideosFromSectionParamsSchema = z.object({
    section_id: z.string().transform(Number),
})
const getAllVideosFromSectionQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
})
videosRouter.get('/section/:section_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { section_id: sectionId } = getAllVideosFromSectionParamsSchema.parse(req.params)
    const { page, limit } = getAllVideosFromSectionQuerySchema.parse(req.query)
    const currentUserId = req.user?.id

    const skip: number = getSkip(page, limit)

    const [videos, total] = await Promise.all([
        db.video.findMany({
            where: {
                sectionId
            },
            skip,
            take: limit,
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
        db.video.count({where: {sectionId}})
    ])

    const formattedVideos = videos.map(video => ({
        ...video,
        saved_time: video.savedTimes?.[0]?.time ?? null,
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

const getVideoParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
videosRouter.get('/:video_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = getVideoParamsSchema.parse(req.params)
    const currentUserId = req.user?.id

    if (currentUserId) addVideoToHistory(currentUserId, videoId).then()

    let [videoFromDB] = await Promise.all([
        db.video.findUnique({
            where: {
                id: videoId
            },
            select: {
                id: true,
                name: true,
                url: true,
                previewUrl: true,
                createdAt: true,
                duration: true,
                viewsCount: true,
                likesCount: true,
                channel: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                },
                savedTimes: {
                    where: {
                        userId: currentUserId ?? -1
                    },
                    select: {
                        time: true
                    }
                },
                likes: {
                    where: {
                        userId: currentUserId ?? -1
                    },
                    select: {
                        id: true
                    }
                },
                watchLater: {
                    where: {
                        userId: currentUserId ?? -1
                    },
                    select: {
                        id: true
                    }
                }
            }
        }),
        db.video.update({
            where: {
                id: videoId
            },
            data: {
                viewsCount: {increment: 1}
            }
        })
    ])

    if (!videoFromDB) throw videoException

    const video = {
        ...videoFromDB,
        saved_time: videoFromDB?.savedTimes?.[0]?.time ?? null,
        savedTimes: undefined,
        is_liked: !!videoFromDB?.likes?.length,
        likes: undefined,
        is_watch_later: !!videoFromDB?.watchLater?.length,
        watchLater: undefined,
    }

    res.json(video)
}))

const getRecommendedVideosParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
const getRecommendedVideosQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
    seed: z.string().optional().default('0.5').transform(Number),
})
videosRouter.get('/recommended/:video_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = getRecommendedVideosParamsSchema.parse(req.params)
    const { page, limit, seed } = getRecommendedVideosQuerySchema.parse(req.query)
    const currentUserId = req.user?.id

    const video = await db.video.findUnique({
        where: {
            id: videoId,
        }
    })
    if (!video) throw videoException

    const usedIds = new Set<number>([video.id])
    const finalVideos: any[] = []

    const videoSelect = {
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
                userId: currentUserId ?? -1
            },
            select: {
                time: true
            }
        }
    }

    if (page === 1) {
        if (video.sectionId !== null && video.sectionIndex !== null) {
            const episodes = await db.video.findMany({
                where: {
                    sectionId: video.sectionId,
                    sectionIndex: {gt: video.sectionIndex},
                    id: {notIn: Array.from(usedIds)}
                },
                take: 2,
                select: videoSelect
            })
            finalVideos.push(...episodes)
            episodes.forEach(v => usedIds.add(v.id))
        }

        const authorVideos = await db.video.findMany({
            where: {
                channelId: video.channelId,
                id: {notIn: Array.from(usedIds)}
            },
            take: 3,
            select: videoSelect
        })
        finalVideos.push(...authorVideos)
        authorVideos.forEach(v => usedIds.add(v.id))

        if (video.tags?.length > 0) {
            const similarVideos = await db.video.findMany({
                where: {
                    id: {notIn: Array.from(usedIds)},
                    tags: {hasSome: video.tags}
                },
                take: 5,
                select: videoSelect
            })
            finalVideos.push(...similarVideos)
            similarVideos.forEach(v => usedIds.add(v.id))
        }
    }

    const skip = getSkip(page, limit)
    const needed = limit - finalVideos.length

    if (needed > 0) {
        const [_, randomRowsResult] = await db.$transaction([
            db.$executeRaw`SELECT setseed(${seed})`,
            db.$queryRaw`
                SELECT id FROM "Video" 
                WHERE id <> ALL(${Array.from(usedIds)})
                ORDER BY RANDOM() 
                LIMIT ${needed} OFFSET ${skip}
            `
        ]) as [unknown, { id: number }[]]
        const randomIds = randomRowsResult.map(r => r.id)
        if (randomIds.length > 0) {
            const randomVideos = await db.video.findMany({
                where: {
                    id: { in: randomIds }
                },
                select: videoSelect
            })
            const map = new Map(randomVideos.map(v => [v.id, v]))
            randomIds.forEach(id => {
                const item = map.get(id)
                if (item) {
                    finalVideos.push(item)
                    usedIds.add(item.id)
                }
            })
        }
    }

    const total = await db.video.count()

    const formattedVideos = finalVideos.map(video => ({
        ...video,
        saved_time: video.savedTimes?.[0]?.time ?? null,
        savedTimes: undefined
    }))

    res.json({
        videos: formattedVideos,
        total,
        page,
        limit,
        has_more: (skip + limit) < total
    })
}))