import { Router } from "express";
import { getPrize, getQuestions, retakeQuiz, submitAnswers } from "../Controllers/quiz.controller.js";

const router = Router()

router.post('/getQuestions', getQuestions)
router.post('/submitAnswers', submitAnswers)
router.get('/getPrize/:userToken', getPrize)
router.post('/retakeQuiz', retakeQuiz)

export default router