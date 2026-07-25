import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {registrationException, authException} from "../utils/httpExceptions.js";
import {createJWTToken, getUser} from "../utils/auth.js";

export const authRouter = Router();

const productName: string = process.env.PRODUCT_NAME as string

const registerQuerySchema = z.object({
    login: z.string(),
    password: z.string(),
    name: z.string(),
})
authRouter.post('/auth/register', asyncHandler(async (req: Request, res: Response) => {
    const queryParams = registerQuerySchema.parse(req.body)
    const { login, password, name } = queryParams

    const existingUser = await db.user.findUnique({where: {login}})
    if (existingUser) throw registrationException

    const hashedPassword: string = await bcrypt.hash(password, 10)

    const newUser = await db.user.create({
        data: {
            login,
            name: name.trim(),
            password: hashedPassword
        }
    })

    console.log(`Пользователь ${newUser.name} зарегистрировался в приложении ${productName}`)

    const {password: _, ...userWithoutPassword} = newUser

    res.status(201).json({
        user: {
            ...userWithoutPassword,
            router_map: '',
            search_history: ''
        },
        token: createJWTToken(newUser.id),
    })
}))

const authQuerySchema = z.object({
    login: z.string(),
    password: z.string(),
})
authRouter.post('/auth/login', asyncHandler(async (req: Request, res: Response) => {
    const queryParams = authQuerySchema.parse(req.body)
    const { login} = queryParams

    const user = await db.user.findUnique({where: {login}})
    if (!user) throw authException

    console.log(`Пользователь ${user.name} авторизовался в приложении ${productName}`)

    res.status(201).json({
        user: {
            ...user,
            router_map: '',
            search_history: ''
        },
        token: createJWTToken(user.id),
    })
}))

authRouter.get('/auth/me', getUser(), asyncHandler(async (req: Request, res: Response) => {
    res.json({
        user: req.user,
        token: createJWTToken(req.user!.id),
    })
}))