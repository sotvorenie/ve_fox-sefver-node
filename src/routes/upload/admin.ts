import { Router, type Request, type Response } from 'express';
import multer from 'multer';

import {uploadStorage} from "@composables/useUploadStorage.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin} from "@utils/auth.js";

import {uploadFile, uploadVideo} from "@routes/upload/services.js";
import {uploadConstantTypes} from "@routes/upload/constants.js";

export const adminUploadRouter = Router();

const index = multer({storage: uploadStorage})
adminUploadRouter.post(
    '/',
    getAdmin(),
    index.fields([
        {name: 'video', maxCount: 1},
        {name: 'preview', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadVideo(req, res)
    })
)

const preview = multer({storage: uploadStorage})
adminUploadRouter.post(
    '/preview',
    getAdmin(),
    preview.fields([
        {name: 'preview', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadFile(req, res, uploadConstantTypes.preview)
    })
)

const video = multer({storage: uploadStorage})
adminUploadRouter.post(
    '/video',
    getAdmin(),
    video.fields([
        {name: 'video', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadFile(req, res, uploadConstantTypes.video)
    })
)