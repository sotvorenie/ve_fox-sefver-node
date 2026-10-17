import { Router, type Request, type Response } from 'express';
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import {db} from "@/db.js";

import {ALLOWED_PHOTO_SUFFIX, CHANNELS_AVATARS_DIRECTORY} from "@/config.js";

import {uploadStorage} from "@composables/useUploadStorage.js";
import {createUrl} from "@composables/useCreateUrl.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin} from "@utils/auth.js";
import {duplicationChannelException, photoFormatException, uploadedPhotoException} from "@utils/httpExceptions.js";

import {deleteFile} from "@services/deleteFile.js";

import {channelIdSchema} from "@schemas/channelIdSchema.js";
import {sectionIdSchema} from "@schemas/sectionIdSchema.js";
import {nameSchema} from "@schemas/nameSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminChannelRouter = Router();

adminChannelRouter.delete('/delete/:channel_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.params)

    await db.channel.delete({
        where: {
            id: channelId
        }
    })

    successResponse(res)
}))

adminChannelRouter.delete('/sections/delete/:section_id', asyncHandler(async (req: Request, res: Response) => {
    const { section_id: sectionId } = sectionIdSchema.parse(req.params)

    await db.channelSection.delete({
        where: {
            id: sectionId,
        }
    })

    successResponse(res)
}))

adminChannelRouter.patch('/sections/redact_name/:section_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { section_id: sectionId } = sectionIdSchema.parse(req.params)
    const { name } = nameSchema.parse(req.body)

    await db.channelSection.update({
        where: {
            id: sectionId
        },
        data: {
            name
        }
    })

    successResponse(res)
}))

adminChannelRouter.patch('/redact_name/:channel_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.params)
    const { name } = nameSchema.parse(req.body)

    const duplicationChannel = await db.channel.findUnique({
        where: {
            name
        }
    })
    if (duplicationChannel?.name === name) throw duplicationChannelException

    await db.channel.update({
        where: {
            id: channelId
        },
        data: {
            name
        }
    })

    successResponse(res)
}))

const avatar = multer({storage: uploadStorage})
adminChannelRouter.patch(
    '/upload_avatar/:channel_id',
    getAdmin(),
    avatar.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const { channel_id: channelId } = channelIdSchema.parse(req.body)

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const file = files?.avatar?.[0]

        if (!file) throw uploadedPhotoException

        const suffix = path.extname(file.originalname).toLowerCase()
        if (!ALLOWED_PHOTO_SUFFIX.has(suffix)) throw photoFormatException

        let targetPath: string | null = null

        try {
            req.checkAborted()

            await fs.mkdir(CHANNELS_AVATARS_DIRECTORY, { recursive: true })

            req.checkAborted()

            targetPath = path.join(CHANNELS_AVATARS_DIRECTORY, `${Date.now()}${suffix}`)
            await fs.rename(file.path, targetPath)

            req.checkAborted()

            const oldUrl = await db.channel.findUnique({
                where: {
                    id: channelId
                },
                select: {
                    avatarUrl: true
                }
            })
            if (oldUrl?.avatarUrl) await deleteFile(oldUrl.avatarUrl)

            db.channel.update({
                where: {
                    id: channelId
                },
                data: {
                    avatarUrl: createUrl(targetPath),
                }
            })

            successResponse(res)
        } catch (err) {
            if (targetPath) await fs.unlink(targetPath).catch()

            await fs.unlink(files?.avatar?.[0]?.path ?? '').catch()

            throw err
        }
    })
)
