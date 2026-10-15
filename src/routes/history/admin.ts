import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin} from "@utils/auth.js";

import {getAllVideos, modelMap} from "@services/getAllVideosService.js";

import {userIdSchema} from "@schemas/userIdSchema.js";
import {videoIdSchema} from "@schemas/videoIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminHistoryRouter = Router();

adminHistoryRouter.get('/all_from_user/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await getAllVideos(req, res, modelMap.history, userId)
}))

adminHistoryRouter.delete('/delete/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
    const { user_id: userId } = userIdSchema.parse(req.query)

    await db.history.delete({
        where: {
            userId_videoId: {
                userId,
                videoId
            }
        }
    })

    successResponse(res)
}))