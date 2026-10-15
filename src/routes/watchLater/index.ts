import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import {getUser} from "@utils/auth.js";

import {getAllVideos, modelMap} from "@services/getAllVideosService.js";

import {adminWatchLaterRouter} from "@routes/watchLater/admin.js";
import {addToWatchLater, deleteFromWatchLater} from "@routes/watchLater/services.js";

export const watchLaterRouter = Router();

watchLaterRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await getAllVideos(req, res, modelMap.watchLater, currentUserId)
}))

watchLaterRouter.post('/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await addToWatchLater(req, res, currentUserId)
}))

watchLaterRouter.delete('/delete/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await deleteFromWatchLater(req, res, currentUserId)
}))

watchLaterRouter.use('/admin', adminWatchLaterRouter)