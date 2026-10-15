import { Router, type Request, type Response } from 'express';
import multer from 'multer';

import {uploadStorage} from "@composables/useUploadStorage.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getUser} from "@utils/auth.js";

import {uploadVideo} from "@routes/upload/services.js";
import {adminUploadRouter} from "@routes/upload/admin.js";

export const uploadRouter = Router();

const index = multer({storage: uploadStorage})
uploadRouter.post(
    '/',
    getUser(),
    index.fields([
        {name: 'video', maxCount: 1},
        {name: 'preview', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        await uploadVideo(req, res)
    })
)

uploadRouter.use('/admin', adminUploadRouter)