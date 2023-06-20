
import util           from  'util'
import express        from  'express'
import Router         from  'express'
import cookieParser   from  'cookie-parser'
import passport       from  'passport'
import jwt            from  'jsonwebtoken'
import bcrypt         from  'bcryptjs'
import { PrismaClient } from  '@prisma/client'


const router            = new Router()
,     prisma            = new PrismaClient()


router.use( express.json() )
router.use( cookieParser() )


/* ##################################*/
/* #                                #
/* #              Router            #
/* #                                #
/* ##################################*/

router.post( '/users'
, passport.authenticate( 'jwt', { session: false })
, async( req, res )=>{
    let user = await prisma.user.findUnique( { where: { id: req.user.id }})
    if( user.role !== 'admin' ){
      res.json({ result: null })
    }
    let users = await prisma.user.findMany({})
    
    res.json( users )

})

export default router

