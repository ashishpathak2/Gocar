const user = require("../models/userModel");
const passport = require("passport")
const googlePassport = require("passport-google-oauth20");


passport.use(new googlePassport({
    callbackURL:process.env.GOOGLE_CALLBACKURL,
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET
  },(accessToken,refreshToken,profile,done)=>{
      user.findOne({googleID:profile.id}).then((currentUser)=>{
        if (currentUser) {
          return done(null,currentUser)
        }
        new user({
          googleID:profile.id,
          email:profile._json.email,
          name:profile.displayName
        }).save().then((newUser)=>{ 
          done(null,newUser)
        })
      
  
      })
   
  })
  )
  
  
  passport.serializeUser(function(user,done){
    done(null,user);
  })
  
  passport.deserializeUser(function(user,done){
    done(null,user)
  })