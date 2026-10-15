import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import {getUser} from "@utils/auth.js";

import {adminHistoryRouter} from "@routes/history/admin.js";

import {getAllVideos, modelMap} from "@services/getAllVideosService.js";

export const historyRouter = Router();

historyRouter.get('/all', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await getAllVideos(req, res, modelMap.history, currentUserId)
}))

historyRouter.use('/admin', adminHistoryRouter)