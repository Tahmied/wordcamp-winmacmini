import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        required: true,
    },
    correctAnswer: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'hard'],
        required: true,
        index: true, 
    },
});

const Question = mongoose.model('Question', questionSchema);

export default Question;