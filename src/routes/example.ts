import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";

export const videoRouter = Router();

const getVideosQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
    seed: z.string().optional().default('0.5').transform(Number),
})
videoRouter.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const queryParams = getVideosQuerySchema.parse(req.query)
    const { page, limit, seed } = queryParams

    const skip = getSkip(page, limit)

    await db.$executeRaw`SELECT setseed(${seed})`

    const total = await db.video.count()

    const videos = await db.video.findMany({
        skip: skip,
        take: limit,
        include: {
            channel: true,
        },
        orderBy: {
            id: 'asc'
        }
    })

    res.json({
        videos: videos,
        total: total,
        page: page,
        limit: limit,
        has_more: (skip + limit) < total,
    })
}))

const sectionParamsSchema = z.object({
    section_id: z.string().transform(Number),
})
videoRouter.get('/all_from_section/:section_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { section_id } = sectionParamsSchema.parse(req.params)
    const userId = req.user?.id

    const total = await db.video.count({
        where: { sectionId: section_id }
    })

    const videos = await db.video.findMany({
        where: { sectionId: section_id },
        include: {
            channel: true,
        }
    })

    res.json({
        videos: videos,
        total: total,
        page: 1,
        limit: 0,
        has_more: false,
    })
}))