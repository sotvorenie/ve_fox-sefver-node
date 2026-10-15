import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin, getUser} from "@utils/auth.js";

import {deleteFromSearchHistory, getSearchHistory, setToSearchHistory} from "@routes/search/services.js";

import {userIdSchema} from "@schemas/userIdSchema.js";

export const adminSearchRouter = Router();

adminSearchRouter.get('/get_history/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await getSearchHistory(res, userId)
}))

adminSearchRouter.post('/set_history/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await setToSearchHistory(req, res, userId)
}))

adminSearchRouter.delete('/delete_from_history', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await deleteFromSearchHistory(req, res, userId)
}))