import { User } from "../Models/user.model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, profession, company, hasPostedSocial, socialPlatform, socialPostLink } = req.body;
    if ([name, email, phone].some((field) => field?.trim() === "")) {
        throw new ApiError(400, 'Name, email, and phone are required');
    }
    if (hasPostedSocial && (!socialPlatform || !socialPostLink)) {
        throw new ApiError(400, 'If you have posted, please provide the platform and the post link.');
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        throw new ApiError(409, 'This email or phone has already been registered');
    }

    const ipAddress = req.ip;
    const userToken = crypto.randomUUID();

    const user = await User.create({
        name,
        email,
        phone,
        profession,
        company,
        userToken,
        ipAddress, hasPostedSocial: hasPostedSocial || false, 
        socialPlatform: hasPostedSocial ? socialPlatform : null,
        socialPostLink: hasPostedSocial ? socialPostLink : null,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            { userToken: user.userToken, name: user.name },
            'User registered successfully'
        )
    );
});