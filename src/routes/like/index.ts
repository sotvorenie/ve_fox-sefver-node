import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import {getUser} from "@utils/auth.js";

import {adminLikesRouter} from "@routes/like/admin.js";

import {getAllVideos, modelMap} from "@services/getAllVideosService.js";

import {likeVideo} from "@routes/like/services.js";

export const likesRouter = Router();

likesRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await getAllVideos(req, res, modelMap.like, currentUserId)
}))

likesRouter.post('/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await likeVideo(req, res, currentUserId)
}))

likesRouter.use('/admin', adminLikesRouter)