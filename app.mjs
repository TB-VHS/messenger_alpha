import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { engine } from 'express-handlebars'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const httpServer = createServer( app )
const io = new Server( httpServer )

app.use( express.static( './public' ))
app.use( express.json() )
app.use( express.urlencoded({ extended: true }) )

app.engine( 'handlebars', engine() )
app.set( 'view engine', 'handlebars' )
app.set( 'views', './views' )


app.get( '/'
, ( req, res )=>{
    res.redirect( '/messenger' )
})

app.get( '/messenger'
, ( req, res )=>{
    res.render( 'messenger', { title: 'Messenger α', serverSocket: `${ process.env.HTTP_HOST }:${ process.env.HTTP_PORT }` })
})
app.get( '/login'
, ( req, res )=>{
    res.render( 'login', {})
})

app.post( '/login'
, ( req, res )=>{
    console.log( req.body.username )
    console.log( req.body.password )

})


io.on( 'connection' 
, ( socket ) => {
    console.log('someone connected!')
    socket.emit( 'message', { content: 'Hallo Client'} )

    socket.on( 'message'
    , msg =>{ 
        console.log( 'message:', msg.content )
    })
})


httpServer.listen( 
  process.env.HTTP_PORT 
, () => console.log( `server started with port ${ process.env.HTTP_PORT }` )
)