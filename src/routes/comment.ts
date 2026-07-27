import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {db} from "../db.js";

import { asyncHandler } from '../utils/asyncHandler.js';
import {getSkip} from "../composables/useGetSkip.js";
import {getUser} from "../utils/auth.js";
import {noCommentException, notMyCommentException} from "../utils/httpExceptions.js";

export const commentsRouter = Router();

const getVideoCommentsParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
const getVideoCommentsQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
    is_new: z.string().optional().default('true').transform(Boolean),
    get_total: z.string().optional().default('true').transform(Boolean),
})
commentsRouter.get('/:video_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = getVideoCommentsParamsSchema.parse(req.params)
    const { page, limit, is_new: isNew, get_total: getTotal } = getVideoCommentsQuerySchema.parse(req.query)
    const currentUserId = req.user?.id

    const skip: number = getSkip(page, limit)

    const [comments, total] = await Promise.all([
        db.comment.findMany({
            where: {
                videoId,
                parentId: null
            },
            skip,
            take: limit,
            orderBy: isNew ? {date: 'desc'} : {likes: 'desc'},
            select: {
                id: true,
                text: true,
                date: true,
                likes: true,
                isRedacted: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                },
                _count: {
                    select: {
                        replies: true
                    }
                },
                commentLikes: {
                    where: {
                        userId: currentUserId ?? -1
                    },
                    select: {
                        id: true
                    }
                }
            }
        }),
        getTotal ? db.comment.count({where: {videoId, parentId: null}}) : Promise.resolve(0)
    ])

    const formattedComments = comments.map(comment => ({
        ...comment,
        question_comments_count: comment._count.replies,
        is_liked: comment.commentLikes.length > 0,
        _count: undefined,
        commentLikes: undefined
    }))

    res.json({
        comments: formattedComments,
        total,
        page,
        limit,
        has_more: (skip + limit) < total,
    })
}))

const getVideoPopularCommentParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
commentsRouter.get('/popular/:video_id', asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = getVideoPopularCommentParamsSchema.parse(req.params)

    const [comment, total] = await Promise.all([
        db.comment.findFirst({
            where: {
                videoId,
                parentId: null
            },
            take: 1,
            orderBy: {likes: 'desc'},
            select: {
                id: true,
                text: true,
                date: true,
                likes: true,
                isRedacted: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                }
            }
        }),
        db.comment.count({where: {videoId}})
    ])

    const formattedComment = {
        ...comment,
        question_comments_count: 0,
        is_liked: false,
    }

    res.json({
        comment: formattedComment,
        total,
    })
}))

const getVideoCommentAnswersParamsSchema = z.object({
    comment_id: z.string().transform(Number),
})
const getVideoCommentAnswersQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('21').transform(Number),
})
commentsRouter.get('/answers/:comment_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { comment_id: commentId } = getVideoCommentAnswersParamsSchema.parse(req.params)
    const { page, limit } = getVideoCommentAnswersQuerySchema.parse(req.query)
    const currentUserId = req.user?.id

    const skip: number = getSkip(page, limit)

    const [comments, total] = await Promise.all([
        db.comment.findMany({
            where: {
                parentId: commentId
            },
            skip,
            take: limit,
            orderBy: {date: 'desc'},
            select: {
                id: true,
                text: true,
                date: true,
                isRedacted: true,
                likes: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                },
                _count: {
                    select: {
                        replies: true
                    }
                },
                commentLikes: {
                    where: {
                        userId: currentUserId ?? -1
                    },
                    select: {
                        id: true
                    }
                }
            }
        }),
        db.comment.count({where:{parentId: commentId}})
    ])

    const formattedComments = comments.map(comment => ({
        ...comment,
        question_comments_count: comment._count.replies,
        is_liked: comment.commentLikes.length > 0,
        _count: undefined,
        commentLikes: undefined,
    }))

    res.json({
        comments: formattedComments,
        total,
        page,
        limit,
        has_more: (skip + limit) < total,
    })
}))

const addCommentParamsSchema = z.object({
    video_id: z.string().transform(Number),
})
const addCommentBodySchema = z.object({
    text: z.string(),
    parent_id: z.union([z.string(), z.number()]).nullish().transform(val => val ? Number(val) : null)
})
commentsRouter.post('/add/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = addCommentParamsSchema.parse(req.params)
    const { text, parent_id: parentId } = addCommentBodySchema.parse(req.body)
    const currentUserId = req.user!.id

    const redactedCommentText: string = text.trim().slice(0, 1000)

    const newComment = await db.comment.create({
        data: {
            text: redactedCommentText,
            isRedacted: false,
            likes: 0,
            parentId,
            userId: currentUserId,
            videoId,
        },
        select: {
            id: true,
            text: true,
            date: true,
            likes: true,
            isRedacted: true,
            parentId: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                }
            }
        }
    })

    const formattedComment = {
        ...newComment,
        question_comments_count: 0,
        is_liked: false,
    }

    res.json(formattedComment)
}))

const redactCommentParamsSchema = z.object({
    comment_id: z.string().transform(Number),
})
const redactCommentBodySchema = z.object({
    text: z.string(),
})
commentsRouter.patch('/redact/:comment_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { comment_id: commentId } = redactCommentParamsSchema.parse(req.params)
    const { text } = redactCommentBodySchema.parse(req.body)
    const currentUserId = req.user!.id

    const comment = await db.comment.findUnique({
        where: {
            id: commentId
        }
    })

    if (!comment) throw noCommentException
    if (comment.userId !== currentUserId) throw notMyCommentException

    const redactedCommentText: string = text.trim().slice(0, 1000)

    const updatedComment = await db.comment.update({
        where: {
            id: commentId,
        },
        data: {
            text: redactedCommentText,
            isRedacted: true,
        },
        select: {
            id: true,
            text: true,
            date: true,
            isRedacted: true,
            likes: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                }
            },
            _count: {
                select: {
                    replies: true
                }
            }
        }
    })

    const formattedComment = {
        ...updatedComment,
        question_comments_count: updatedComment._count.replies,
        is_liked: false,
    }

    res.json(formattedComment)
}))

const deleteCommentParamsSchema = z.object({
    comment_id: z.string().transform(Number),
})
commentsRouter.delete('/delete/:comment_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { comment_id: commentId } = deleteCommentParamsSchema.parse(req.params)
    const currentUserId = req.user!.id

    const comment = await db.comment.findUnique({
        where: {
            id: commentId
        }
    })

    if (!comment) throw noCommentException
    if (comment.userId !== currentUserId) throw notMyCommentException

    await db.comment.delete({
        where: {
            id: commentId
        }
    })

    res.json({
        success: true,
    })
}))

const likeCommentParamsSchema = z.object({
    comment_id: z.string().transform(Number),
})
commentsRouter.post('/like/:comment_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const { comment_id: commentId } = likeCommentParamsSchema.parse(req.params)
    const currentUserId = req.user!.id

    const comment = await db.comment.findUnique({
        where: {
            id: commentId
        }
    })

    if (!comment) throw noCommentException

    const existingLike = await db.commentLike.findUnique({
        where: {
            userId_commentId: {
                userId: currentUserId,
                commentId: commentId,
            }
        }
    })

    let isLiked = false

    await db.$transaction(async (tx) => {
        if (existingLike) {
            await tx.commentLike.delete({
                where: {
                    userId_commentId: {
                        userId: currentUserId,
                        commentId: commentId,
                    }
                }
            })
            await tx.comment.update({
                where: {id: commentId},
                data: {likes: {decrement: 1}}
            })
            isLiked = false
        } else {
            await tx.commentLike.create({
                data: {
                    userId: currentUserId,
                    commentId
                }
            })
            await tx.comment.update({
                where: {id: commentId},
                data: {likes: {increment: 1}}
            })
            isLiked = true
        }
    })

    res.json({
        is_liked: isLiked
    })
}))