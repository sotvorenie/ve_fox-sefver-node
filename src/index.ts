import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import {testRouter} from "./routes/test.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', testRouter)

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`)
})