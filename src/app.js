import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler } from "./Middlewares/errorHandler.middleware.js";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import adminRoutes from './Routes/admin.routes.js';
import quizRoutes from './Routes/quiz.routes.js';
import userRoutes from './Routes/user.routes.js';
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/questions', quizRoutes)

app.use(errorHandler)
export { app };
