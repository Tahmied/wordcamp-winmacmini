import mongoose from 'mongoose';

const prizeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String, 
        required: true,
    },
    scoreToWin: {
        type: Number,
        required: true,
        index: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
});

const Prize = mongoose.model('Prize', prizeSchema);

export default Prize;