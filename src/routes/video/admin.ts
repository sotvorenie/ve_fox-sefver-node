import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin} from "@utils/auth.js";

import {pathSchema, sectionIndexSchema, viewsSchema} from "@routes/video/schemas.js";
import {updateVideo} from "@routes/video/services.js";
import {videoConstants} from "@routes/video/constants.js";

import {deleteFile} from "@services/deleteFile.js";

import {urlSchema} from "@schemas/urlSchema.js";
import {videoIdSchema} from "@schemas/videoIdSchema.js";
import {nameSchema} from "@schemas/nameSchema.js";
import {channelIdSchema} from "@schemas/channelIdSchema.js";
import {sectionIdSchema} from "@schemas/sectionIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminVideosRouter = Router();

adminVideosRouter.patch('/preview_path/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { path } = pathSchema.parse(req.body)

    await updateVideo(req, res, videoConstants.previewPath(path))
}))

adminVideosRouter.patch('/preview_url/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { url } = urlSchema.parse(req.body)

    await updateVideo(req, res, videoConstants.previewUrl(url))
}))

adminVideosRouter.patch('/views/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { views } = viewsSchema.parse(req.body)

    await updateVideo(req, res, videoConstants.views(views))
}))

adminVideosRouter.delete('/delete/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)

    await db.video.delete({
        where: {
            id: videoId
        }
    })

    successResponse(res)
}))

adminVideosRouter.patch('/redact_name/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { name } = nameSchema.parse(req.body)

    await updateVideo(req, res, videoConstants.name(name))
}))

adminVideosRouter.patch('/redact_channel/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { channel_id: channelId } = channelIdSchema.parse(req.query)

    await updateVideo(req, res, videoConstants.channel(channelId))
}))

adminVideosRouter.patch('/redact_section/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { section_id: sectionId } = sectionIdSchema.parse(req.query)

    await updateVideo(req, res, videoConstants.section(sectionId))
}))

adminVideosRouter.patch('/redact_section_index/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { section_index: sectionIndex } = sectionIndexSchema.parse(req.query)

    await updateVideo(req, res, videoConstants.sectionIndex(sectionIndex))
}))

adminVideosRouter.patch('/delete_preview/:video_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)

    const preview = await db.video.findUnique({
        where: {
            id: videoId
        },
        select: {
            previewUrl: true
        }
    })

    await db.video.update({
        where: {
            id: videoId
        },
        data: {
            previewUrl: ''
        }
    })

    await deleteFile(preview?.previewUrl)

    successResponse(res)
}))
