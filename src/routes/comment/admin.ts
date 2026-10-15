import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin} from "@utils/auth.js";

import {userIdSchema} from "@schemas/userIdSchema.js";

import {addComment, deleteComment, likeComment, redactComment} from "@routes/comment/services.js";

export const adminCommentsRouter = Router();

adminCommentsRouter.post('/add/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await addComment(req, res, userId)
}))

adminCommentsRouter.patch('/redact/:comment_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await redactComment(req, res, userId)
}))

adminCommentsRouter.delete('/delete/:comment_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await deleteComment(req, res, userId)
}))

adminCommentsRouter.post('/like/:comment_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.query)

    await likeComment(req, res, userId)
}))