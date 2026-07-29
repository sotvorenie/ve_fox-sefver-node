import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';

import {dbException} from "./httpExceptions.js";

export const asyncHandler = (fn: Function) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (err: any) {
            console.error("Ошибка в эндпоинте:", err)

            if (err instanceof ZodError) {
                return res.status(400).json({
                    error: "Ошибка валидации данных",
                    details: err.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }

            if (err.status && err.detail) {
                return res.status(err.status).json({ detail: err.detail });
            }

            res.status(dbException.status).json({ error: dbException.detail });
        }
    };
};