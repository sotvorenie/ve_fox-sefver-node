import { type Request, type Response } from 'express';
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import {db} from "@/db.js";

import {ALLOWED_PHOTO_SUFFIX, AVATARS_DIRECTORY} from "@/config.js";

import {createUrl} from "@composables/useCreateUrl.js";

import {duplicationPasswordException, emptyUserDataException, photoFormatException} from "@utils/httpExceptions.js";

import {passwordSchema, routerMapSchema} from "@routes/user/schemas.js";

import {deleteFile} from "@services/deleteFile.js";

import {nameSchema} from "@schemas/nameSchema.js";

import {successResponse} from "@responses/successResponse.js";

const getUser = async (userId: number) => {
    return db.user.findUnique({
        where: {
            id: userId,
        }
    })
}

export const redactName = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { name } = nameSchema.parse(req.body)

    const user = await getUser(userId)
    if (!user) throw emptyUserDataException

    const formattedName = name?.trim()
    if (!formattedName) throw emptyUserDataException

    if (user!.name !== formattedName) {
        await db.user.update({
            where: {
                id: user!.id,
            },
            data: {
                name: formattedName,
            }
        })
    }

    return successResponse(res)
}

export const redactPassword = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { password } = passwordSchema.parse(req.body)

    const user = await getUser(userId)
    if (!user) throw emptyUserDataException

    const formattedPassword = password?.trim()
    if (!formattedPassword) throw emptyUserDataException

    const check: boolean = await bcrypt.compare(formattedPassword, user.password)
    if (check) throw duplicationPasswordException

    const newPassword = await bcrypt.hash(formattedPassword, 10)

    await db.user.update({
        where: {
            id: user.id
        },
        data: {
            password: newPassword,
        }
    })

    return successResponse(res)
}

export const uploadAvatar = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const avatarFile = files?.avatar?.[0]

    if (!avatarFile) throw emptyUserDataException

    const user = await getUser(userId)
    if (!user) throw emptyUserDataException

    const avatarSuffix = path.extname(avatarFile.originalname).toLowerCase()
    if (!ALLOWED_PHOTO_SUFFIX.has(avatarSuffix)) throw photoFormatException

    let targetAvatarPath: string | null = null

    try {
        await fs.mkdir(AVATARS_DIRECTORY, { recursive: true })

        targetAvatarPath = path.join(AVATARS_DIRECTORY, `${user.id}_${Date.now()}${avatarSuffix}`)
        await fs.rename(avatarFile.path, targetAvatarPath)

        const newAvatarUrl: string = createUrl(targetAvatarPath)
        await db.user.update({
            where: {
                id: user.id,
            },
            data: {
                avatarUrl: newAvatarUrl,
            }
        })

        if (user.avatarUrl) await deleteFile(user.avatarUrl)

        successResponse(res)
    } catch (err) {
        if (targetAvatarPath) await fs.unlink(targetAvatarPath).catch()

        await fs.unlink(files?.avatar?.[0]?.path ?? '').catch()

        throw err
    }
}

export const getRouterMap = async (
    res: Response,
    userId: number,
) => {
    const user = await db.user.findUnique({
        where: {
            id: userId
        },
        select: {
            routerMap: true,
        }
    })

    res.json({
        routerMap: user?.routerMap ?? null
    })
}

export const setRouterMap = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { router_map: routerMap } = routerMapSchema.parse(req.body)

    await db.user.update({
        where: {
            id: userId,
        },
        data: {
            routerMap,
        }
    })

    return successResponse(res)
}