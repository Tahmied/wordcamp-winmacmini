import jwt from 'jsonwebtoken'
import { Admin } from '../Models/admin.model.js'
import { ApiResponse } from '../Utils/ApiResponse.js'

export async function findUser(req,res,next) {
try {
        let accessToken = req.cookies?.AccessToken || req.header('Authorization')?.replace('Bearer ' ,'')
        if(!accessToken){
            new ApiResponse(400 , `access token not found`)
        }
    
        let decodedAccessToken = jwt.verify(accessToken , process.env.ACCESS_TOKEN_KEY)
        if(!decodedAccessToken){
            new ApiResponse(400 , 'can\'t decode access token')
        }
        
        let user = await Admin.findById(decodedAccessToken._id)
        if(!user){
            new ApiResponse(404 , 'user not found')
        }
        req.admin = user
        next()
} catch (error) {
    if(error.name === 'JsonWebTokenError' || error.name === `TokenExpiredError`){
        return res.status(401).json(
            new ApiResponse(401 , null , 'Invalid or expired token')
        )
    }
    new ApiResponse( 401 , `auth middleware error - ${error}`)
}
}