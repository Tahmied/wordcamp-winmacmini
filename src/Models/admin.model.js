import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        required : true
    },
    email:{
        type:String,
        required:true,
        unique : true,
        lowercase : true,
        trim : true
    },
    password : {
        type : String,
        required : true
    },
    refreshToken : {
        type : String
    },
    accessToken : {
        type : String
    }
}, {
    timestamps : true
})

userSchema.pre('save' , async function (next) {
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password , 10)
    }
    next()
})

userSchema.methods.isPassCorrect = async function (password) {
    return bcrypt.compare(password , this.password)    
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id : this._id,
        email : this.email
    } , process.env.ACCESS_TOKEN_KEY , {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id : this._id,
        email : this.email
    } , process.env.REFRESH_TOKEN_KEY , {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const Admin = mongoose.model('Admin' , userSchema)