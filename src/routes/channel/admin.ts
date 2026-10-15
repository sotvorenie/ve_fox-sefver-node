import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getAdmin} from "@utils/auth.js";

import {getChannel} from "@routes/channel/services.js";

import {channelIdSchema} from "@schemas/channelIdSchema.js";
import {sectionIdSchema} from "@schemas/sectionIdSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminChannelRouter = Router();

adminChannelRouter.get('/:channel_id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await getChannel(req, res, true)
}))

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