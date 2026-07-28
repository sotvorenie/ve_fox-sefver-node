import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {getAllVideos, modelMap} from "../services/getAllVideosService.js";

export const historyRouter = Router();

const getHistoryQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
})
historyRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getHistoryQuerySchema.parse(req.query)
    const currentUserId = req.user!.id

    const {videos, total, skip} = await getAllVideos(modelMap.history, currentUserId, page, limit)

    res.json({
        videos,
        total,
        page,
        limit,
        has_more: (skip + limit) < total,
    })
}))