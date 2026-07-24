import 'dotenv/config'
import jwt from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from "../db.js";

import {jwtException} from "./httpExceptions.js";
import {asyncHandler} from "./asyncHandler.js";

dotenv.config();

const SECRET_KEY: string = process.env.SECRET_KEY || '';

export const createJWTToken = (userId: number | string) => {
    const expiresIn = 60 * 60 * 24 * 7;
    const payload = {sub: String(userId)}
    const accessToken = jwt.sign(payload, SECRET_KEY, {expiresIn})

    return {
        accessToken,
        token_type: 'bearer',
    }
}

export const getUser = (required: boolean = true) => {
    return asyncHandler(async (req: Request, _: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
            if (required) throw jwtException
            return next()
        }

        const token = authHeader.split(' ')[1]
        const payload = jwt.verify(token as string, SECRET_KEY) as { sub: string }

        const user = await prisma.user.findUnique({
            where: { id: Number(payload.sub) }
        })

        if (!user) throw jwtException;

        (req as any).user = user
        next()
    })
}