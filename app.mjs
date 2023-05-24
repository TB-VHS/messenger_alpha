import dotenv from 'dotenv'
dotenv.config()

import config           from './config.mjs'
import util             from 'util'
import express          from 'express'
import jwt              from 'jsonwebtoken'
import { engine }       from 'express-handlebars'
import cookieParser     from  'cookie-parser'
import { createServer } from 'http'
import { Server }       from 'socket.io'
import { PrismaClient } from '@prisma/client'
import bcrypt           from 'bcryptjs'
import passport         from 'passport'
import winston          from 'winston'


const app         = express()
const httpServer  = createServer( app )
const io          = new Server( httpServer )
const prisma      = new PrismaClient()
const logger      = winston.createLogger( config.winston.logger )
const msgLogger   = winston.createLogger( config.winston.msgLogger )


app.use( express.static( './public' ))
app.use( cookieParser() )
app.use( express.json() )
app.use( express.urlencoded({ extended: true }) )

app.engine( 'handlebars', engine() )
app.set( 'view engine', 'handlebars' )
app.set( 'views', './views' )

/* passport middleware */
import( './auth/passport_local-jwt.mjs' )
app.use( passport.initialize() )


/* --- routes ---*/

app.get( '/'
, ( req, res )=>{
    res.redirect( '/login' )
})

app.get( '/messenger'
, passport.authenticate( 'jwt', { session: false })
, async( req, res )=>{
    res.render( 'messenger', { title: 'Messenger α', serverSocket: `${ process.env.HTTP_HOST }:${ process.env.HTTP_PORT }` })
})

app.get( '/login'
, ( req, res )=>{
    res.render( 'login', {})
})
app.post( '/login'
, async( req, res )=>{
    console.log( 'login:' )
    console.log( req.body.email )
    console.log( req.body.password )
    passport.authenticate( 'local'
    , { session: false }
    , async( err, user )=>{
        if( err || !user ){
          return res.status( 400 ).json({ message:  'Something is not right'
                                        , err:      err
                                        , user:     user
                                        })
        }
        let jwtData   = { id:             user.id
                        , iat:            Date.now()
//                        , exp:
                        }
/* assigns jwtData to req.user */
        req.login(
          jwtData
        , { session: false }
        , err =>{
            if( err ){
              util.log( `JWT ERROR: ${ util.inspect( err )}`)
              res.status( 400 ).json({ err })
            }
            else { /* if no error */
              let jwtToken      = jwt.sign( JSON.stringify( jwtData ), process.env.JWT_SECRET )
              ,   cookieOptions = process.env.NODE_ENV === 'production' ? { httpOnly: true, secure: true } : {}
              res.cookie( 'jwt', jwtToken, cookieOptions )
              res.redirect( `/messenger` )
            }
        })
      }
    )( req, res )
})


app.get( '/user/:username'
, passport.authenticate( 'jwt', { session: false })
, async function validateUsername( req, res, next ){
    let user = await prisma.user.findUnique({ where: { id: req.user.id }})
    if( user.username !== req.params.username ){
      console.log( 'Unerlaubter Zugriff' )
    }
    return next()
  }
, async( req, res )=>{
    let user = await prisma.user.findUnique({ where: { id: req.user.id }})

    res.render( 'user'
              , { user:   user })
})


app.get( '/user/logout'
, passport.authenticate( 'jwt', { session: false })
, ( req, res )=>{
    req.logout()
    res.redirect( '/' )
})


app.get( '/register'
, ( req, res )=>{
    res.render( 'register', {})
})
app.post( '/register'
, async( req, res )=>{
    console.log( 'register:' )
    console.log( req.body.username )
    console.log( req.body.email )
    console.log( req.body.password )
    console.log( req.body.password2 )
    
    if( req.body.password === req.body.password2 ){
      const user = await prisma.user.create({
        data: {
          username: req.body.username
        , email:    req.body.email
        , password: bcrypt.hashSync( req.body.password, 10 )
        }
      })
      res.redirect( '/login' )
    }
})


io.on( 'connection' 
, ( socket ) => {
    console.log('someone connected!')
    socket.emit( 'message', { target: 'sticky-alert'
                            , content: 'You are connected <i class="fi-xnsuxl-star-solid green3"></i>'
                            })

    socket.on( 'message'
    , msg =>{ 
        console.log( 'message:', msg.content )
        io.emit( 'message', { target: 'message-list'
                            , content: msg.content 
                            })
    })
})


httpServer.listen( 
  process.env.HTTP_PORT 
, process.env.HTTP_LISTEN
, logger.info( `Node.js Express+Socket.IO Server ${ process.env.HTTP_HOST } listening on ${ process.env.HTTP_LISTEN }:${ process.env.HTTP_PORT }` )
)