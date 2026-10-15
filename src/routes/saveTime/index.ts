import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import {getUser} from "@utils/auth.js";

import {adminSaveTimesRouter} from "@routes/saveTime/admin.js";
import {deleteVideoTime, setVideoTime} from "@routes/saveTime/services.js";

export const saveTimesRouter = Router();

saveTimesRouter.post('/set/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await setVideoTime(req, res, currentUserId)
}))

saveTimesRouter.delete('/delete/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await deleteVideoTime(req, res, currentUserId)
}))

saveTimesRouter.use('/admin', adminSaveTimesRouter)