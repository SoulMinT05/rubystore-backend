import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import dbConnect from './config/dbConnect.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan()); //Ghi log request đến server
app.use(
    // Bảo vệ server khỏi các lỗ hổng bảo mật phổ biến
    helmet({
        crossOriginResourcePolicy: false,
    }),
);

const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.json({
        message: 'Server is running ' + port,
    });
});

dbConnect().then(() => {
    app.listen(port, () => {
        console.log('Server is running in ' + port);
    });
});
