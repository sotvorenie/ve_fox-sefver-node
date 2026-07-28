import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises'
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getUser} from "../utils/auth.js";
import {
    channelException,
    photoFormatException,
    uploadedVideoException,
    videoFormatException
} from "../utils/httpExceptions.js";
import {ALLOWED_PHOTO_SUFFIX, ALLOWED_VIDEO_SUFFIX, VIDEOS_DIRECTORY} from "../config.js";
import {normalizePathName} from "../composables/useNormalizePathName.js";
import {createUrl} from "../composables/useCreateUrl.js";
import {getVideoDuration} from "../composables/useGetVideoDuration.js";
import {uploadStorage} from "../composables/useUploadStorage.js";

export const uploadRouter = Router();

const uploadBodySchema = z.object({
    title: z.string().min(1),
    channel_id: z.string().transform(Number),
    section_id: z.string().optional().transform(val => val ? Number(val) : null),
    tags: z.string().optional().transform(val => {
        if (!val) return []
        return val.split(',').map((t: string) => t.trim()).filter(Boolean)
    })
})
const upload = multer({storage: uploadStorage})
uploadRouter.post(
    '/',
    getUser(),
    upload.fields([
        {name: 'video', maxCount: 1},
        {name: 'preview', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const { title, channel_id: channelId, section_id: sectionId, tags } = uploadBodySchema.parse(req.body)

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const videoFile = files?.video?.[0]
        const previewFile = files?.preview?.[0]

        if (!videoFile) throw uploadedVideoException

        const channel = await db.channel.findUnique({
            where: {
                id: channelId
            }
        })
        if (!channel) throw channelException

        const formattedName = normalizePathName(title)

        const videoSuffix = path.extname(videoFile.originalname).toLowerCase()
        if (!ALLOWED_VIDEO_SUFFIX.has(videoSuffix)) throw videoFormatException

        let previewSuffix: string = ''
        if (previewFile) {
            previewSuffix = path.extname(previewFile.originalname).toLowerCase()
            if (!ALLOWED_PHOTO_SUFFIX.has(previewSuffix)) throw photoFormatException
        }

        let targetVideoPath: string | null = null
        let targetPreviewPath: string | null = null

        try {
            const videosDirectory = path.join(VIDEOS_DIRECTORY, channel.name, 'videos')
            const previewsDirectory = path.join(VIDEOS_DIRECTORY, channel.name, 'previews')
            await fs.mkdir(videosDirectory, { recursive: true })
            await fs.mkdir(previewsDirectory, { recursive: true })

            targetVideoPath = path.join(videosDirectory, `${formattedName}${videoSuffix}`)
            await fs.rename(videoFile.path, targetVideoPath)

            if (previewFile) {
                targetPreviewPath = path.join(previewsDirectory, `${formattedName}${previewSuffix}`)
                await fs.rename(previewFile.path, targetPreviewPath)
            }

            const videoDuration = await getVideoDuration(targetVideoPath)
            const newVideo = await db.video.create({
                data: {
                    name: formattedName,
                    url: createUrl(targetVideoPath),
                    duration: videoDuration,
                    previewUrl: targetPreviewPath ? createUrl(targetPreviewPath) : '',
                    channelId,
                    tags,
                    sectionId,
                }
            })

            res.json(newVideo)
        } catch (err) {
            if (targetVideoPath) {
                await fs.unlink(targetVideoPath).catch()
            }
            if (targetPreviewPath) {
                await fs.unlink(targetPreviewPath).catch()
            }

            const files = req.files as { [fieldname: string]: Express.Multer.File[] }
            if (files?.video?.[0]) {
                await fs.unlink(files.video[0].path).catch()
            }
            if (files?.preview?.[0]) {
                await fs.unlink(files.preview[0].path).catch()
            }

            throw err
        }
    })
)