import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import bcrypt from "bcryptjs";
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises'
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {duplicationPasswordException, emptyUserDataException, photoFormatException} from "../utils/httpExceptions.js";
import {ALLOWED_PHOTO_SUFFIX, AVATARS_DIRECTORY} from "../config.js";
import {uploadStorage} from "../composables/useUploadStorage.js";
import {createUrl} from "../composables/useCreateUrl.js";

export const userRouter = Router();

const redactUserNameBodySchema = z.object({
    name: z.string(),
})
userRouter.patch('/redact_name', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { name } = redactUserNameBodySchema.parse(req.body)
    const currentUser = req.user!

    const formattedName = name?.trim()
    if (!formattedName) throw emptyUserDataException

    if (currentUser.name !== formattedName) {
        await db.user.update({
            where: {
                id: currentUser.id,
            },
            data: {
                name: formattedName,
            }
        })
    }

    res.json({
        success: true,
    })
}))

const checkUserPasswordBodySchema = z.object({
    password: z.string(),
})
userRouter.post('/check_password', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { password } = checkUserPasswordBodySchema.parse(req.body)
    const currentUser = req.user!

    const formattedPassword = password?.trim()
    if (!formattedPassword) throw emptyUserDataException

    const check: boolean = await bcrypt.compare(password, currentUser.password)

    res.json({
        success: check,
    })
}))

const redactUserPasswordBodySchema = z.object({
    password: z.string(),
})
userRouter.patch('/redact_password', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { password } = redactUserPasswordBodySchema.parse(req.body)
    const currentUser = req.user!

    const formattedPassword = password?.trim()
    if (!formattedPassword) throw emptyUserDataException

    const check: boolean = await bcrypt.compare(password, currentUser.password)
    if (check) throw duplicationPasswordException

    const newPassword = await bcrypt.hash(password, 10)

    await db.user.update({
        where: {
            id: currentUser.id
        },
        data: {
            password: newPassword,
        }
    })

    res.json({
        success: true,
    })
}))

const upload = multer({storage: uploadStorage})
userRouter.post(
    '/upload_avatar',
    getUser(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const currentUser = req.user!

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const avatarFile = files?.avatar?.[0]

        if (!avatarFile) throw emptyUserDataException

        const avatarSuffix = path.extname(avatarFile.originalname).toLowerCase()
        if (!ALLOWED_PHOTO_SUFFIX.has(avatarSuffix)) throw photoFormatException

        let targetAvatarPath: string | null = null

        try {
            await fs.mkdir(AVATARS_DIRECTORY, { recursive: true })

            targetAvatarPath = path.join(AVATARS_DIRECTORY, `${currentUser.id}_${Date.now()}${avatarSuffix}`)
            await fs.rename(avatarFile.path, targetAvatarPath)

            const newAvatarUrl: string = createUrl(targetAvatarPath)
            await db.user.update({
                where: {
                    id: currentUser.id,
                },
                data: {
                    avatarUrl: newAvatarUrl,
                }
            })

            if (currentUser.avatar_url) {
                const oldAvatarPath = path.join(AVATARS_DIRECTORY, currentUser.avatar_url)
                await fs.unlink(oldAvatarPath).catch()
            }

            res.json({
                new_avatar_url: newAvatarUrl,
            })
        } catch (err) {
            if (targetAvatarPath) {
                await fs.unlink(targetAvatarPath).catch()
            }

            const files = req.files as { [fieldname: string]: Express.Multer.File[] }
            if (files?.avatar?.[0]) {
                await fs.unlink(files.avatar[0].path).catch()
            }

            throw err
        }
    })
)

userRouter.get('/get_router_map', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    const user = await db.user.findUnique({
        where: {
            id: currentUserId
        },
        select: {
            routerMap: true,
        }
    })

    res.json({
        router_map: user?.routerMap ?? null
    })
}))

const setUserRouterMapBodySchema = z.object({
    router_map: z.string(),
})
userRouter.post('/set_router_map', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { router_map: routerMap } = setUserRouterMapBodySchema.parse(req.body)
    const currentUserId = req.user!.id

    await db.user.update({
        where: {
            id: currentUserId,
        },
        data: {
            routerMap,
        }
    })

    res.json({
        success: true,
    })
}))