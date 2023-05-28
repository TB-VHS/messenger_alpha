
import path    from 'path'
import winston from 'winston'

let config = {
  appName:  'messenger-alpha'
, winston:  {
    logger:     {
                  level:      'debug'
                , transports: [
                                new winston.transports.Console({
                                      format: winston.format.combine( winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
                                                                    , winston.format.printf( info => `${ info.timestamp } --- ${ info.level }: ${ info.message }` )
                                                                    )
                                    })
                              , new winston.transports.File({ filename: path.join( 'logs', 'app.log' )
                                                            , format:   winston.format.combine(
                                                                          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' })
                                                                        , winston.format.printf( info => `${ info.timestamp } | ${ info.level } | ${ info.message }` )
                                                                        )
                                    })
                              ]
                }
  }

}

export default config