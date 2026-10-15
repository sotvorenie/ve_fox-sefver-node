import { Router, type Request, type Response } from 'express';
import {db} from "@/db.js";

import {getSkip} from "@composables/useGetSkip.js";

import { asyncHandler } from '@utils/asyncHandler.js';
import {getUser} from "@utils/auth.js";

import {adminCommentsRouter} from "@routes/comment/admin.js";
import {commentIdSchema, getVideoCommentsQuerySchema} from "@routes/comment/schemas.js";

import {videoIdSchema} from "@schemas/videoIdSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

import {channelForListOrUserSelect} from "@selects/channelForListOrUserSelect.js";

import {addComment, deleteComment, likeComment, redactComment} from "@routes/comment/services.js";

export const commentsRouter = Router();

commentsRouter.get('/:video_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)
    const { page, limit, is_new: isNew } = getVideoCommentsQuerySchema.parse(req.query)
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
                    select: channelForListOrUserSelect
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
        db.comment.count({where: {videoId, parentId: null}})
    ])

    const formattedComments = comments.map(comment => ({
        ...comment,
        questionCommentsCount: comment._count.replies,
        isLiked: comment.commentLikes.length > 0,
        _count: undefined,
        commentLikes: undefined
    }))

    res.json({
        comments: formattedComments,
        total,
        page,
        limit,
        hasMore: (skip + limit) < total,
    })
}))

commentsRouter.get('/popular/:video_id', asyncHandler(async (req: Request, res: Response) => {
    const { video_id: videoId } = videoIdSchema.parse(req.params)

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
                    select: channelForListOrUserSelect
                }
            }
        }),
        db.comment.count({where: {videoId}})
    ])

    const formattedComment = {
        ...comment,
        questionCommentsCount: 0,
        isLiked: false,
    }

    res.json({
        comment: formattedComment,
        total,
    })
}))

commentsRouter.get('/answers/:comment_id', getUser(false), asyncHandler(async (req: Request, res: Response) => {
    const { comment_id: commentId } = commentIdSchema.parse(req.params)
    const { page, limit } = pageLimitSchema.parse(req.query)
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
                    select: channelForListOrUserSelect
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
        isLiked: comment.commentLikes.length > 0,
        _count: undefined,
        commentLikes: undefined,
    }))

    res.json({
        comments: formattedComments,
        total,
        page,
        limit,
        hasMore: (skip + limit) < total,
    })
}))

commentsRouter.post('/add/:video_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await addComment(req, res, currentUserId)
}))

commentsRouter.patch('/redact/:comment_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await redactComment(req, res, currentUserId)
}))

commentsRouter.delete('/delete/:comment_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await deleteComment(req, res, currentUserId)
}))

commentsRouter.post('/like/:comment_id', getUser(), asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user!.id

    await likeComment(req, res, currentUserId)
}))

commentsRouter.use('/admin', adminCommentsRouter)