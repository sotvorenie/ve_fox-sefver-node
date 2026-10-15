import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import {db} from "@/db.js";

import {uploadStorage} from "@composables/useUploadStorage.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin, getUser} from "@utils/auth.js";

import {getRouterMap, redactName, redactPassword, setRouterMap, uploadAvatar} from "@routes/user/services.js";

import {userIdSchema} from "@schemas/userIdSchema.js";
import {urlSchema} from "@schemas/urlSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminUserRouter = Router();

adminUserRouter.patch('/redact_name/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await redactName(req, res, userId)
}))

adminUserRouter.patch('/redact_password/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await redactPassword(req, res, userId)
}))

const upload = multer({storage: uploadStorage})
adminUserRouter.post(
    '/upload_avatar',
    getUser(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const { user_id: userId } = userIdSchema.parse(req.params)

        await uploadAvatar(req, res, userId)
    })
)

adminUserRouter.patch('/redact_avatar_url/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)
    const { url } = urlSchema.parse(req.query)

    await db.user.update({
        where: {
            id: userId,
        },
        data: {
            avatarUrl: url,
        }
    })

    successResponse(res)
}))

adminUserRouter.get('/get_router_map/:user_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await getRouterMap(res, userId)
}))

adminUserRouter.post('/set_router_map', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = userIdSchema.parse(req.params)

    await setRouterMap(req, res, userId)
}))