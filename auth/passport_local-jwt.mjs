
import util from 'util'
import { PrismaClient } from '@prisma/client'
import bcrypt           from 'bcryptjs'
import passport         from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as JWTStrategy }   from 'passport-jwt'

const prisma = new PrismaClient()


passport.use(
  new LocalStrategy(
    {
      usernameField: 'email'
    , passwordField: 'password'
    }
  , async( username, password, done )=>{
      try {
        let user    = await prisma.user.findUnique({ where: { email: username }})
        ,   pwCheck = bcrypt.compareSync( password, user.password )
        console.log( `Login: user ${ username } - password: ${ password } --> ${ pwCheck }`)

        if( pwCheck ) return done( null, user )
        else          return done( null, false )
      }
      catch( err ){
        console.log( `ERROR login check: ${ err }` )
      }
}))


passport.use(
  new JWTStrategy(
    {
      secretOrKey:    process.env.JWT_SECRET
    , jwtFromRequest: req => req.cookies.jwt
    }
  , ( jwtData, done )=>{
      return done( null, jwtData )
/* jwt expiration check */
      // if( Date.now() > jwtData.exp )  return done( 'access token expired' )
      // else                            return done( null, jwtData )
}))
