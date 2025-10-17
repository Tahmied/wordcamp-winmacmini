import Prize from "../Models/prize.model.js";
import Question from "../Models/question.model.js";
import { User } from "../Models/user.model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";

export const getQuestions = asyncHandler(async (req, res) => {
    const { userToken } = req.body;

    if (!userToken) {
        throw new ApiError(400, 'User token is required.');
    }

    const user = await User.findOne({ userToken });

    user.quizState.attemptCount += 1;

    let easyQuestionsCount, hardQuestionsCount;
    if (user.quizState.attemptCount === 1) {
        easyQuestionsCount = 2;
        hardQuestionsCount = 1;
    } else {
        easyQuestionsCount = 1;
        hardQuestionsCount = 2;
    }

    const excludedIds = user.quizState.servedQuestions;

    const easyQuestions = await Question.aggregate([
        { $match: { difficulty: 'easy', _id: { $nin: excludedIds } } },
        { $sample: { size: easyQuestionsCount } }
    ]);

    const hardQuestions = await Question.aggregate([
        { $match: { difficulty: 'hard', _id: { $nin: excludedIds } } },
        { $sample: { size: hardQuestionsCount } }
    ]);

    const fetchedQuestions = [...easyQuestions, ...hardQuestions];

    if (fetchedQuestions.length < 3) {
        throw new ApiError(500, 'Not enough unique questions available.');
    }

    const fetchedQuestionIds = fetchedQuestions.map(q => q._id);
    user.quizState.servedQuestions.push(...fetchedQuestionIds);
    await user.save({ validateBeforeSave: false });

    const questionsForFrontend = fetchedQuestions.map(q => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        difficulty: q.difficulty
    }));

    return res.status(200).json(
        new ApiResponse(200, questionsForFrontend, "Questions fetched successfully")
    );
});

export const submitAnswers = asyncHandler(async (req, res) => {
    const { userToken, answers } = req.body;

    if (!userToken || !answers || !Array.isArray(answers)) {
        throw new ApiError(400, 'User token and a valid answers array are required.');
    }

    const user = await User.findOne({ userToken });

    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    if (user.status !== 'pending') {
        throw new ApiError(403, 'You have already finalized your quiz attempt.');
    }

    let score = 0;
    const questionIds = answers.map(a => a.questionId);

    const correctQuestions = await Question.find({
        '_id': { $in: questionIds }
    }).select('+correctAnswer');

    const answerMap = new Map(correctQuestions.map(q => [q._id.toString(), q.correctAnswer]));

    for (const answer of answers) {
        const correctAnswer = answerMap.get(answer.questionId);
        if (correctAnswer && correctAnswer === answer.selectedOption) {
            score++;
        }
    }

    user.quizState.score = score;
    if (score > 1) {
        user.status = 'completed';
    } else {
        user.status = 'failed';
    }

    if (user.quizState.retaking) {
        user.quizState.retakeUsed = true;
        user.quizState.retaking = false;
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            { score },
            "Quiz submitted successfully. Thank you for participating!"
        )
    );
});

export const getPrize = asyncHandler(async (req, res) => {
    const { userToken } = req.params;
    if (!userToken) {
        throw new ApiError(400, 'User token is required.');
    }

    const user = await User.findOne({ userToken }).populate('assignedPrize');

    if (!user) {
        throw new ApiError(404, 'User not found.');
    }
    if (user.status === 'pending') {
        throw new ApiError(403, 'The quiz must be completed to see the results.');
    }

    if (user.assignedPrize) {
        const resultData = {
            token: user.userToken,
            score: user.quizState.score,
            prize: user.assignedPrize
        };
        return res.status(200).json(
            new ApiResponse(200, resultData, "Previously assigned prize fetched successfully.")
        );
    }

    let prizeToAssign = null;
    const score = user.quizState.score;

    if (score === 1 || score === 2 || score === 3) {
        prizeToAssign = await Prize.findOneAndUpdate(
            { scoreToWin: score, stock: { $gt: 0 } },
            { $inc: { stock: -1 } },
            { new: true }
        );
    }

    if (!prizeToAssign) {
        prizeToAssign = {
            name: "Thanks for Participating!",
            image: "/uploads/prizes/participation.png"
        };
    }

    if (prizeToAssign._id) {
        user.assignedPrize = prizeToAssign._id;
        await user.save({ validateBeforeSave: false });
    }

    const resultData = {
        token: user.userToken,
        score: score,
        prize: {
            name: prizeToAssign.name,
            image: prizeToAssign.image
        }
    };

    return res.status(200).json(
        new ApiResponse(200, resultData, "Prize assigned and fetched successfully.")
    );
});

export const setPrize = asyncHandler(async (req, res) => {
    const { name, scoreToWin, stock } = req.body;

    const prizeImage = req.file;

    if (!name || !scoreToWin || !stock) {
        throw new ApiError(400, 'Prize name and scoreToWin are required.');
    }

    if (!prizeImage) {
        throw new ApiError(400, 'Prize image is required.');
    }

    const imagePath = `/${prizeImage.path.split('public/')[1]}`;

    const prize = await Prize.create({
        name,
        image: imagePath,
        scoreToWin: Number(scoreToWin),
        stock: Number(stock)
    });

    return res.status(201).json(new ApiResponse(201, prize, "Prize created successfully"));
});

export const retakeQuiz = asyncHandler(async (req, res) => {
    const { userToken } = req.body;
    if (!userToken) {
        throw new ApiError(400, 'User token is required.');
    }
    const user = await User.findOne({ userToken });
    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    if (user.status !== 'failed') {
        throw new ApiError(403, 'You can only retake the quiz if you have failed.');
    }
    if (user.quizState.score > 1) {
        throw new ApiError(403, 'A retake is only available for scores of 0 or 1.');
    }
    if (user.quizState.retakeUsed) {
        throw new ApiError(403, 'You have already used your one retake attempt.');
    }

    user.status = 'pending'
    user.quizState.retaking = true


    const excludedIds = user.quizState.servedQuestions;
    const hardQuestions = await Question.aggregate([
        { $match: { difficulty: 'hard', _id: { $nin: excludedIds } } },
        { $sample: { size: 3 } }
    ]);

    if (hardQuestions.length < 3) {
        throw new ApiError(500, 'Not enough unique hard questions available for a retake.');
    }

    const fetchedQuestionIds = hardQuestions.map(q => q._id);
    user.quizState.servedQuestions.push(...fetchedQuestionIds);
    await user.save({ validateBeforeSave: false });

    const questionsForFrontend = hardQuestions.map(q => ({
        _id: q._id,
        text: q.text,
        options: q.options
    }));

    return res.status(200).json(
        new ApiResponse(200, questionsForFrontend, "Retake questions fetched successfully. Good luck!")
    );
});