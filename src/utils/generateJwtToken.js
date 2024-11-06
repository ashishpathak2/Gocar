const jwt = require("jsonwebtoken")

function generateToken(user) {
    return jwt.sign({email:user.email ,id:user._id},process.env.JWT_SECRET);
}

function verifyToken(token){
    return jwt.verify(token,process.env.JWT_SECRET)

}

module.exports={
    generateToken,verifyToken
}