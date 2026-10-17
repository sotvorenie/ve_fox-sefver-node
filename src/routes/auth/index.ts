import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import {db} from "@/db.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {registrationException, authException} from "@utils/httpExceptions.js";
import {getUser} from "@utils/auth.js";

import {loginPasswordSchema} from "@routes/auth/schemas.js";
import {authResponse} from "@routes/auth/services.js";

import {nameSchema} from "@schemas/nameSchema.js";

export const authRouter = Router();

const productName: string = process.env.PRODUCT_NAME as string

authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
    const { login, password, name } = loginPasswordSchema.extend(nameSchema.shape).parse(req.body)

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
    const { login, password} = loginPasswordSchema.parse(req.body)

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