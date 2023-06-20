import dotenv from 'dotenv'
dotenv.config()

import config           from './config.mjs'
import util             from 'util'
import express          from 'express'
import jwt              from 'jsonwebtoken'
import { engine }       from 'express-handlebars'
import cookieParser     from 'cookie-parser'
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
import api_routes from './routes/api.mjs'
app.use( '/api',  api_routes )

app.get( '/'
, ( req, res )=>{
    res.redirect( '/login' )
})

app.get( '/messenger'
, passport.authenticate( 'jwt', { session: false })
, async( req, res )=>{
    let user = await prisma.user.findUnique({ where: { id: req.user.id }})
    res.render( 'messenger', { title: 'Messenger α', serverSocket: `${ process.env.HTTP_HOST }:${ process.env.HTTP_PORT }`, username: user.username })
})

app.get( '/login'
, ( req, res )=>{
    res.render( 'login', {})
})
app.post( '/login'
, async( req, res )=>{
    if( process.env.NODE_ENV === 'development' ) logger.info( `login with --> email: ${ req.body.email } - password: ${ req.body.password }` )
    passport.authenticate(  'local'
    , { session: false }
    , async( err, user )=>{
                            if( err || !user )  return res.status( 400 ).json({ message:  'Something is not right'
                                                                              , err:      err
                                                                              , user:     user
                                                                              })
                            let jwtData = { 
                                            id:   user.id
                                          , iat:  Date.now()
                                          //, exp:
                                          }
/* assign jwtData to req.user */
                            req.login(  jwtData
                                      , { session: false }
                                      , async( err )=>{
                                          if( err ){
                                            logger.error( `JWT ERROR: ${ util.inspect( err )}`)
                                            res.status( 400 ).json({ err })
                                          }
                                          else { /* if no error */
/* local login success */
                                            let jwtToken      = jwt.sign( JSON.stringify( jwtData ), process.env.JWT_SECRET )
                                            ,   cookieOptions = process.env.NODE_ENV === 'production' ? { httpOnly: true, secure: true } : {}
                                            res.cookie( 'jwt', jwtToken, cookieOptions )
                                            await prisma.user.update({
                                              where: {
                                                id: user.id
                                              },
                                              data: {
                                                lastLoginAt:    new Date()
                                              , onlineStatus:  'online'
                                              }
                                            })
                                            res.redirect( `/messenger` )
                                          }
                            })
                          })( req, res )
})
                          

app.get( '/user/:username'
, passport.authenticate( 'jwt', { session: false })
/* selfmade middleware to check, if user page is called by user */
, async function validateUsername( req, res, next ){
    let user = await prisma.user.findUnique({ where: { id: req.user.id }})
    if( user.username !== req.params.username ){
      console.log( 'Unerlaubter Zugriff' )
    }
    return next()
  }
, async( req, res )=>{
    let user = await prisma.user.findUnique({ where: { id: req.user.id }})
    res.render( 'user', { user: user })
})


app.get( '/user/:username/logout'
, passport.authenticate( 'jwt', { session: false })
, async( req, res )=>{
    await prisma.user.update({
      where: {
        id: req.user.id
      }
    , data: {
        lastLogoutAt:  new Date()
      , onlineStatus:  'offline'
      }
    })
    res.clearCookie( 'jwt' )
    res.redirect( '/' )
})


app.get( '/register'
, ( req, res )=>{
    res.render( 'register', {})
})
app.post( '/register'
, async( req, res )=>{
    if( process.env.NODE_ENV === 'development' ) logger.info( `register with --> username: ${ req.body.username } email: ${ req.body.email } - password: ${ req.body.password } password2: ${ req.body.password2 }` )
                          
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


/* --- Socket.io server ---- */ 
io.on( 'connection' 
, async( socket ) => {
    if( process.env.NODE_ENV === 'development' ) console.log('someone connected!')
    const cookies = socketioCookieStrToJSON( socket.handshake.headers.cookie )

    if( process.env.NODE_ENV === 'development' ) console.log( 'cookies:', cookies )
    const jwtDecoded = jwt.decode( cookies.jwt )

    if( process.env.NODE_ENV === 'development' ) console.log( 'jwtDecoded:', jwtDecoded )
    const user = await prisma.user.findUnique({ where: { id: jwtDecoded.id }})
    socket.userId   = user.id
    socket.username = user.username
    socket.emit( 'message'
    , { target:     'sticky-alert'
      , title:      `Welcome`
      , content:    `<i class="fi-xnsuxl-star-solid green3"></i> Hello ${ user.username }`
      , alertType:  'alert-success'
      , fillType:   'filled-lm'
    })
    let lastMessages = await prisma.message.findMany({
                                                        orderBy:  { datetimeServer: 'desc' }
                                                      , include:  { author: true  }
                                                      , take: 5
                                                    })
    lastMessages.reverse()

    lastMessages.forEach( message =>{
      socket.emit( 'message'
      , { target:     'message-table'
        , datetime:   message.datetimeServer
        , content:    message.content
        , username:   message.author.username
      })
    })

    socket.on( 'message'
    , async msg =>{ 
        console.log( 'message:', msg.content )
        const messageCreate = await prisma.message.create({
          data: {
            datetimeClient:  new Date( msg.datetime )
          , datetimeServer:  new Date()
          , content:         msg.content
          , destination:     msg.destination
          , authorId:        socket.userId
          }
        })
        io.emit( 'message'
        , { target:     'message-table'
          , datetime:   msg.datetime
          , content:    msg.content
          , username:   user.username
        })
    })
    
    socket.on( 'disconnect'
    , () =>{ 
        io.emit( 'message'
        , { target:     'sticky-alert'
          , title:      `Bye bye`
          , content:    `<i class="fi-stprxl-star-solid silver"></i> ${ socket.username } hat den Chat verlassen...`
          , alertType:  'alert-secondary'
          , fillType:   'filled-lm'
        })
    })
})


httpServer.listen( 
  process.env.HTTP_PORT 
, process.env.HTTP_LISTEN
, logger.info( `Node.js environment: ${ process.env.NODE_ENV }
                              Running Express+Socket.IO Server ${ process.env.HTTP_HOST } listening on ${ process.env.HTTP_LISTEN }:${ process.env.HTTP_PORT }` )
)

setInterval( 
  async ()=>{
    let users = await prisma.user.findMany({ where: { onlineStatus: 'online' }, select: { username: true }})
    io.emit( 'message'
    , { target:           'users-online-list'
      , usersOnlineList:  users
    })
  }
  , 2000
)


/* --- helpers --- */

function socketioCookieStrToJSON( handshakeCookie ){
  let cookiesObj    = {}
  ,   cookiesArray  = handshakeCookie.split( ';' )
  
  cookiesArray.forEach( cookieStr =>{
    let cookieArr = cookieStr.split( '=' )
    cookiesObj[ cookieArr[0].trim() ] = cookieArr[1].trim()
  })

  return cookiesObj
} 