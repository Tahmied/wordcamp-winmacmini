import { ApiError } from "../Utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
    // Handle custom ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data,
        });
    }

    // Unexpected errors
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: [err.message],
        data: null,
    });
};