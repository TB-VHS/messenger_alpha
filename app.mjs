import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { engine } from 'express-handlebars'

const app = express()

app.use( express.static( './public' ))
app.use( express.json() )
app.use( express.urlencoded({ extended: true }) )

app.engine( 'handlebars', engine() )
app.set( 'view engine', 'handlebars' )
app.set( 'views', './views' )


app.get( '/'
, ( req, res )=>{
    res.render( 'home', { title: 'Home, mein Pferd' } )
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

app.listen( process.env.HTTP_PORT )