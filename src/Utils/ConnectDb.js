import mongoose from "mongoose";

export const connectDB = async function () {
    try {
        const dbREs = await mongoose.connect(`${process.env.MONGODB_URL}/winmacmini`)
        console.log(`db connected on host ${dbREs.connection.host}`)
    } catch (err) {
        console.log(`db connection failed due to ${err}`)
    }
}

