import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin} from "@utils/auth.js";

import {likeVideo} from "@routes/like/services.js";

import {getAllVideos, modelMap} from "@services/getAllVideosService.js";

import {userIdSchema} from "@schemas/userIdSchema.js";

export const adminLikesRouter = Router();

adminLikesRouter.get('/all_from_user/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await getAllVideos(req, res, modelMap.like, userId)
}))

adminLikesRouter.post('/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await likeVideo(req, res, userId)
}))