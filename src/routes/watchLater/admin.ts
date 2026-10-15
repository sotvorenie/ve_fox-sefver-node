import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin, getUser} from "@utils/auth.js";

import {addToWatchLater, deleteFromWatchLater} from "@routes/watchLater/services.js";

import {getAllVideos, modelMap} from "@services/getAllVideosService.js";

import {userIdSchema} from "@schemas/userIdSchema.js";

export const adminWatchLaterRouter = Router();

adminWatchLaterRouter.get('/all/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await getAllVideos(req, res, modelMap.watchLater, userId)
}))

adminWatchLaterRouter.post('/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await addToWatchLater(req, res, userId)
}))

adminWatchLaterRouter.delete('/delete/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await deleteFromWatchLater(req, res, userId)
}))