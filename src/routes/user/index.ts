import { Router, type Request, type Response } from 'express';
import multer from 'multer';

import {uploadStorage} from "@composables/useUploadStorage.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getUser} from "@utils/auth.js";

import {adminUserRouter} from "@routes/user/admin.js";
import {getRouterMap, redactName, redactPassword, setRouterMap, uploadAvatar} from "@routes/user/services.js";

export const userRouter = Router();

userRouter.patch('/redact_name', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await redactName(req, res, currentUserId)
}))

userRouter.patch('/redact_password', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await redactPassword(req, res, currentUserId)
}))

const upload = multer({storage: uploadStorage})
userRouter.post(
    '/upload_avatar',
    getUser(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const currentUserId = req.user!.id

        await uploadAvatar(req, res, currentUserId)
    })
)

userRouter.get('/get_router_map', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await getRouterMap(res, currentUserId)
}))

userRouter.post('/set_router_map', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await setRouterMap(req, res, currentUserId)
}))

userRouter.use('/admin', adminUserRouter)