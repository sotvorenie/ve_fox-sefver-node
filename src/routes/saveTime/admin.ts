import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin} from "@utils/auth.js";

import {deleteVideoTime, setVideoTime} from "@routes/saveTime/services.js";

import {userIdSchema} from "@schemas/userIdSchema.js";
import {videoIdSchema} from "@schemas/videoIdSchema.js";

export const adminSaveTimesRouter = Router();

adminSaveTimesRouter.get('/get/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
    const { user_id: userId } = userIdSchema.parse(req.query)

    const data = await db.savedTime.findUnique({
        where: {
            userId_videoId: {
                userId,
                videoId
            }
        }
    })

    res.json(data?.time)
}))

adminSaveTimesRouter.post('/set/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await setVideoTime(req, res, userId)
}))

adminSaveTimesRouter.delete('/delete/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await deleteVideoTime(req, res, userId)
}))