import {type Request, type Response, type NextFunction} from "express";
import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import {abortedException} from "@utils/httpExceptions.js";

import {testRouter} from "@/routes/test.js";
import {authRouter} from "@/routes/auth/index.js";
import {channelRouter} from "@/routes/channel/index.js";
import {commentsRouter} from "@/routes/comment/index.js";
import {historyRouter} from "@/routes/history/index.js";
import {likesRouter} from "@/routes/like/index.js";
import {saveTimesRouter} from "@/routes/saveTime/index.js";
import {searchRouter} from "@/routes/search/index.js";
import {uploadRouter} from "@/routes/upload/index.js";
import {userRouter} from "@/routes/user/index.js";
import {videosRouter} from "@/routes/video/index.js";
import {watchLaterRouter} from "@/routes/watchLater/index.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use((req: Request, res: Response, next: NextFunction) => {
    const controller = new AbortController()
    req.abortController = controller

    req.checkAborted = () => {
        if (req.abortController?.signal.aborted) throw abortedException
    }

    res.on('close', () => {
        if (!res.writableEnded) controller.abort()
    })

    next()
})

app.use('/api', testRouter)
app.use('/api/auth', authRouter)
app.use('/api/channel', channelRouter)
app.use('/api/comment', commentsRouter)
app.use('/api/history', historyRouter)
app.use('/api/like', likesRouter)
app.use('/api/save_time', saveTimesRouter)
app.use('/api/search', searchRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/user', userRouter)
app.use('/api/video', videosRouter)
app.use('/api/watch_later', watchLaterRouter)

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`)
})