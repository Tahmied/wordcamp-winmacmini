const asyncHandler = (reqFn) => {
    return async (req,res,next) => {
        try {
            await reqFn(req,res,next)
        } catch (err) {
            next(err)
        }
    }
}

export { asyncHandler }
