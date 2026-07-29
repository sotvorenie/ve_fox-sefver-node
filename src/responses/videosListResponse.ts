import { type Response } from 'express';
import {getSkip} from "../composables/useGetSkip.js";

export const videosListResponse = (
    res: Response,
    videos: any,
    total: number,
    page: number = 1,
    limit: number = 21,
) => {
    const skip: number = getSkip(page, limit)

    return res.json({
        videos,
        total,
        page,
        limit,
        hasMore: (skip + limit) < total,
    })
}