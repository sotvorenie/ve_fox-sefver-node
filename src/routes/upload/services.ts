import { type Request, type Response } from 'express';
import fs from "node:fs/promises";
import path from "node:path";
import {db} from "@/db.js";

import {ALLOWED_PHOTO_SUFFIX, ALLOWED_VIDEO_SUFFIX, VIDEOS_DIRECTORY} from "@/config.js";

import {normalizePathName} from "@composables/useNormalizePathName.js";
import {getVideoDuration} from "@composables/useGetVideoDuration.js";
import {createUrl} from "@composables/useCreateUrl.js";

import {
    photoFormatException,
    uploadedVideoException,
    videoFormatException
} from "@utils/httpExceptions.js";

import {uploadVideoSchema} from "@routes/upload/schemas.js";
import type {UploadConstantType} from "@routes/upload/constants.js";

import {deleteFile} from "@services/deleteFile.js";

import {videoIdSchema} from "@schemas/videoIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const uploadVideo = async (
    req: Request,
    res: Response,
) => {
    const { title, channel_id: channelId, section_id: sectionId, tags } = uploadVideoSchema.parse(req.body)

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const videoFile = files?.video?.[0]
    const previewFile = files?.preview?.[0]

    if (!videoFile) throw uploadedVideoException

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
        const videosDirectory = path.join(VIDEOS_DIRECTORY, 'videos')
        const previewsDirectory = path.join(VIDEOS_DIRECTORY, 'previews')
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

        res.status(201).json(newVideo)
    } catch (err) {
        if (targetVideoPath) await fs.unlink(targetVideoPath).catch()
        if (targetPreviewPath) await fs.unlink(targetPreviewPath).catch()

        await fs.unlink(files?.video?.[0]?.path ?? '').catch()
        await fs.unlink(files?.preview?.[0]?.path ?? '').catch()

        throw err
    }
}

export const uploadFile = async (
    req: Request,
    res: Response,
    type: UploadConstantType
) => {
    const { video_id: videoId } = videoIdSchema.parse(req.body)

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const file = files?.[type.title]?.[0]

    if (!file) throw type.uploadException

    const suffix = path.extname(file.originalname).toLowerCase()
    if (!type.allowedSuffix.has(suffix)) throw type.formatException

    let targetPath: string | null = null

    try {
        const previewsDirectory = path.join(VIDEOS_DIRECTORY, 'previews')
        await fs.mkdir(previewsDirectory, { recursive: true })

        targetPath = path.join(previewsDirectory, `${Date.now()}${suffix}`)
        await fs.rename(file.path, targetPath)

        const oldUrl = await db.video.findUnique({
            where: {
                id: videoId
            },
            select: type.selectForDelete
        })
        if (oldUrl?.[type.bdTitle]) await deleteFile(oldUrl[type.bdTitle])

        db.video.update({
            where: {
                id: videoId
            },
            data: {
                previewUrl: createUrl(targetPath),
            }
        })

        successResponse(res)
    } catch (err) {
        if (targetPath) await fs.unlink(targetPath).catch()

        await fs.unlink(files?.preview?.[0]?.path ?? '').catch()

        throw err
    }
}