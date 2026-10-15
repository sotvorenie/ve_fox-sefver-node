import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {emptyName} from "@utils/httpExceptions.js";

import {valueSchema} from "@routes/search/schemas.js";

import {successResponse} from "@responses/successResponse.js";

export const getSearchHistory = async (
    res: Response,
    userId: number
) => {
    const user = await db.user.findUnique({
        where: {
            id: userId
        },
        select: {
            searchHistory: true
        }
    })

    let history: string[] = []
    if (user?.searchHistory) {
        try {
            history = JSON.parse(user.searchHistory)
        } catch {
            history = []
        }
    }

    res.json({
        searchHistory: history,
    })
}

export const setToSearchHistory = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { value } = valueSchema.parse(req.body)

    const formattedSearch = value.trim()
    if (!formattedSearch?.length) throw emptyName

    const searchHistoryUser = await db.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            searchHistory: true
        }
    })

    let history: string[] = []
    if (searchHistoryUser) {
        try {
            history = JSON.parse(searchHistoryUser?.searchHistory || '[]')
        } catch {
            history = []
        }
    }

    history = history.filter(h => h !== formattedSearch)
    history = [formattedSearch, ...history].slice(0, 10)

    await db.user.update({
        where: {
            id: userId,
        },
        data: {
            searchHistory: JSON.stringify(history)
        }
    })

    return successResponse(res)
}

export const deleteFromSearchHistory = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { value } = valueSchema.parse(req.body)

    const user = await db.user.findUnique({
        where: {
            id: userId
        },
        select: {
            searchHistory: true,
        }
    })

    let history: string[] = []
    if (user?.searchHistory) {
        try {
            history = JSON.parse(user.searchHistory)
        } catch {
            history = []
        }
    }

    if (history.includes(value)) {
        history = history.filter(h => h !== value)
        await db.user.update({
            where: {
                id: userId,
            },
            data: {
                searchHistory: JSON.stringify(history),
            }
        })
    }

    return successResponse(res)
}