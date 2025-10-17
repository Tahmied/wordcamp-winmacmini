import dotenv from 'dotenv';
import { connectDB } from "./Utils/ConnectDb.js";
import { app } from "./app.js";

dotenv.config('./.env')

connectDB()
    .then((res) => {
        app.listen(process.env.PORT || 3120, () => {
            console.log(`running on http://localhost:${process.env.PORT || 3120}`);
        })
    })
    .catch((err) => {
        console.log(`Couldnt connected to the server in server.js due to ${err}`)
    })