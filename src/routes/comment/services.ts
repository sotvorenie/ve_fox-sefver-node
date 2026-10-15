import { type Request, type Response } from 'express';
import {db} from "@/db.js";

import {noCommentException, notMyCommentException} from "@utils/httpExceptions.js";

import {addCommentBodySchema, commentIdSchema, commentTextSchema} from "@routes/comment/schemas.js";

import {videoIdSchema} from "@schemas/videoIdSchema.js";

import {channelForListOrUserSelect} from "@selects/channelForListOrUserSelect.js";

import {successResponse} from "@responses/successResponse.js";

export const addComment = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { text, parent_id: parentId } = addCommentBodySchema.parse(req.body)
    const { video_id: videoId } = videoIdSchema.parse(req.body)

    const redactedCommentText: string = text.trim().slice(0, 1000)

    const newComment = await db.comment.create({
        data: {
            text: redactedCommentText,
            isRedacted: false,
            likes: 0,
            parentId,
            userId: userId,
            videoId,
        },
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
    })

    const formattedComment = {
        ...newComment,
        questionCommentsCount: 0,
        isLiked: false,
    }

    res.json(formattedComment)
}

export const redactComment = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { comment_id: commentId } = commentIdSchema.parse(req.params)
    const { text } = commentTextSchema.parse(req.body)

    const comment = await db.comment.findUnique({
        where: {
            id: commentId
        }
    })

    if (!comment) throw noCommentException
    if (comment.userId !== userId) throw notMyCommentException

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
                select: channelForListOrUserSelect
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
        questionCommentsCount: updatedComment._count.replies,
        isLiked: false,
    }

    res.json(formattedComment)
}

export const deleteComment = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { comment_id: commentId } = commentIdSchema.parse(req.params)

    const comment = await db.comment.findUnique({
        where: {
            id: commentId
        }
    })

    if (!comment) throw noCommentException
    if (comment.userId !== userId) throw notMyCommentException

    await db.comment.delete({
        where: {
            id: commentId
        }
    })

    return successResponse(res)
}

export const likeComment = async (
    req: Request,
    res: Response,
    userId: number,
) => {
    const { comment_id: commentId } = commentIdSchema.parse(req.params)

    const comment = await db.comment.findUnique({
        where: {
            id: commentId
        }
    })

    if (!comment) throw noCommentException

    const existingLike = await db.commentLike.findUnique({
        where: {
            userId_commentId: {
                userId: userId,
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
                        userId: userId,
                        commentId: commentId,
                    }
                }
            })
            await tx.comment.update({
                where: {id: commentId},
                data: {likes: {decrement: 1}}
            })
        } else {
            await tx.commentLike.create({
                data: {
                    userId: userId,
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

    successResponse(res)
}