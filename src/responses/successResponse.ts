import { type Response } from 'express';

export const successResponse = (
    res: Response,
    successValue: boolean = true
) => {
    return res.json({
        success: successValue,
    })
}