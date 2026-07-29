import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {getAllVideos, modelMap} from "../services/getAllVideosService.js";
import {pageLimitSchema} from "../schemas/pageLimitSchema.js";
import {videosListResponse} from "../responses/videosListResponse.js";

export const historyRouter = Router();

historyRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = pageLimitSchema.parse(req.query)
    const currentUserId = req.user!.id

    const {videos, total} = await getAllVideos(modelMap.history, currentUserId, page, limit)

    return videosListResponse(res, videos, total, page, limit)
}))