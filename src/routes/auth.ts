import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import {z} from "zod";
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {registrationException, authException} from "../utils/httpExceptions.js";
import {createJWTToken, getUser} from "../utils/auth.js";

export const authRouter = Router();

const productName: string = process.env.PRODUCT_NAME as string

const authBaseScheme = z.object({
    login: z.string(),
    password: z.string(),
})

const authResponse = (
    res: Response,
    user: { id: number; name: string; password?: string; [key: string]: any },
) => {
    const { password, ...userWithoutPassword } = user

    return res.status(201).json({
        user: {
            ...userWithoutPassword,
            routerMap: '',
            searchHistory: '',
        },
        token: createJWTToken(user.id),
    })
}

const registerBodySchema = authBaseScheme.extend({
    name: z.string(),
})
authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
    const { login, password, name } = registerBodySchema.parse(req.body)

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

    return authResponse(res, newUser)
}))

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { login, password} = authBaseScheme.parse(req.body)

    const user = await db.user.findUnique({where: {login}})
    if (!user) throw authException

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) throw authException

    console.log(`Пользователь ${user.name} авторизовался в приложении ${productName}`)

    return authResponse(res, user)
}))

authRouter.get('/me', getUser(), asyncHandler(async (req: Request, res: Response) => {
    return authResponse(res, req.user!)
}))