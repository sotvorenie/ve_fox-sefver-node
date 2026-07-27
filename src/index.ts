import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import {DataSynchronizer} from "./cache.js";
import {testRouter} from "./routes/test.js";
import {authRouter} from "./routes/auth.js";
import {channelRouter} from "./routes/channel.js";
import {commentsRouter} from "./routes/comment.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', testRouter)
app.use('/api/auth', authRouter)
app.use('/api/channel', channelRouter)
app.use('/api/comment', commentsRouter)

app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту ${PORT}`)

    try {
        const synchronizer = new DataSynchronizer()
        await synchronizer.sync()
    } catch (err) {
        console.error(err)
    }
})