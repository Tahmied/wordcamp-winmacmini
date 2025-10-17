
import { Admin } from "../Models/admin.model.js"
import { User } from "../Models/user.model.js"
import { ApiError } from "../Utils/ApiError.js"
import { ApiResponse } from "../Utils/ApiResponse.js"
import { asyncHandler } from "../Utils/AsyncHandler.js"

// auth controllers

async function generateAccessTokenAndRefreshToken(adminId) {
    let admin = await Admin.findById(adminId)
    if (!admin) {
        throw new ApiError(500, 'unable to find the admin to generate tokens')
    }

    let accessToken = admin.generateAccessToken()
    let refreshToken = admin.generateRefreshToken()

    if (!accessToken || !refreshToken) {
        throw new ApiError(500, 'unable to generate access and refresh token for admin')
    }

    admin.accessToken = accessToken
    admin.refreshToken = refreshToken
    await admin.save({ validateBeforeSave: false })

    return { "accessToken": accessToken, "refreshToken": refreshToken }
}

export const registeradmin = asyncHandler(async (req, res) => {
    let { name, email, password } = req.body
    if ([name, email, password].some((e) => !e)) {
        throw new ApiError(400, 'all fields are required')
    }

    try {
        await Admin.create({
            name, email, password
        })
        return res.status(200).json(
            new ApiResponse(200, [], 'admin registered successfully')
        )
    } catch (error) {
        throw new ApiError(500, `couldn't register the admin due to ${error}`)
    }
})

export const loginadmin = asyncHandler(async (req, res) => {
    let { email, password } = req.body
    if (!email || !password) {
        throw new ApiError(400, 'email and password are required')
    }

    let admin = await Admin.findOne({ email: email })
    if (!admin) {
        throw new ApiError(404, `No admin found with this email`)
    }

    let checkPass = await admin.isPassCorrect(password)
    if (!checkPass) {
        throw new ApiError(400, 'wrong password')
    }

    let { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(admin._id)

    if (!accessToken || !refreshToken) {
        throw new ApiError(500, 'unable to login due to not found access and refresh token for admin')
    }

    let cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }

    const tokensToReturn = {
        accessToken : accessToken,
        refreshToken : refreshToken
    }

    return res.status(200)
        .cookie('AccessToken', accessToken, cookieOptions)
        .cookie('RefreshToken', refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, [tokensToReturn], 'admin logged in')
        )

})

export const refreshToken = asyncHandler(async (req, res) => {
    // find the current admin based on current refresh token
    let admin = req.admin
    if (!admin) {
        throw new ApiError(400, 'unable to find the admin to refresh token')
    }
    // generate new access and refresh token
    let { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(admin._id)
    if (!accessToken || !refreshToken) {
        throw new ApiError(500, 'unable to generate access and refresh token for admin to refresh the tokens')
    }

    // set the new access and refresh token to cookies
    let cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }

    if (accessToken || refreshToken) {
        return res.status(200)
            .cookie("AccessToken", accessToken, cookieOptions)
            .cookie("RefreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(200, null, 'tokens refreshed')
            )
    }
})

export const checkLogin = asyncHandler(async (req, res) => {
    let admin = req.admin
    if (!admin) {
        return res.status(200).json(
            new ApiResponse(200, { isLoggedIn: false }, 'admin is not logged in')
        )
    }
    return res.status(200).json(
        new ApiResponse(200, { isLoggedIn: true }, 'admin is logged in')
    )
})

export const logOut = asyncHandler(async (req, res) => {
    let admin = req.admin
    if (!admin) {
        throw new ApiError(404, `admin not found to logout`)
    }

    admin.accessToken = null
    admin.refreshToken = null
    await admin.save()

    let cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }

    return res.status(200)
        .clearCookie('AccessToken', cookieOptions)
        .clearCookie('RefreshToken', cookieOptions)
        .json(
            new ApiResponse(200, null, 'admin logged out sucksexfully')
        )
})

// admin dashboard controllers

export const getUsers = asyncHandler(async (req, res) => {
    const { search = "" } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
        $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { userToken: { $regex: search, $options: 'i' } },
        ],
    };
    const users = await User.find(query)
        .select('-ipAddress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignedPrize')

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json(
        new ApiResponse(200, {
            users,
            currentPage: page,
            totalPages,
            totalUsers
        }, "Users fetched successfully")
    );
});

export const changeUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'completed', 'failed', 'rewarded'].includes(status)) {
        throw new ApiError(400, "Invalid status provided. Must be 'pending', 'completed', or 'failed'.");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { status: status },
        { new: true, runValidators: true }
    ).select('-ipAddress');

    if (!updatedUser) {
        throw new ApiError(404, "User not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User status updated successfully")
    );
});
