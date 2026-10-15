import type {Response} from "express";

import {createJWTToken} from "@utils/auth.js";

export const authResponse = (
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