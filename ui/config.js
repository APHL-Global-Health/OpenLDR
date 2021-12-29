const path = require('path');
const assert = require( "assert" );
const dotenv = require( "dotenv" );

dotenv.config({path: path.join(__dirname + `/.env`)});

const {
    HTTP_PORT, 
    HTTPS_PORT, 
    HTTPS_PFX, 
    HTTPS_PASSPHRASE,

    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_LIFE,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_LIFE,

    ACCESS_TOKEN_EMAIL,
    ACCESS_TOKEN_PASSWORD,
    CRYPTO_ALGORITHM,
    CRYPTO_KEY,
    CRYPTO_IV

} = process.env;

assert( HTTP_PORT, "HTTP_PORT configuration is required." ); 
assert( HTTPS_PORT, "HTTPS_PORT configuration is required." ); 
assert( HTTPS_PFX, "HTTPS_PFX configuration is required." ); 
assert( HTTPS_PASSPHRASE, "HTTPS_PASSPHRASE configuration is required." );

assert( ACCESS_TOKEN_SECRET, "ACCESS_TOKEN_SECRET configuration is required." );
assert( ACCESS_TOKEN_LIFE, "ACCESS_TOKEN_LIFE configuration is required." );
assert( REFRESH_TOKEN_SECRET, "REFRESH_TOKEN_SECRET configuration is required." );
assert( REFRESH_TOKEN_LIFE, "REFRESH_TOKEN_LIFE configuration is required." );

assert( ACCESS_TOKEN_EMAIL, "ACCESS_TOKEN_EMAIL configuration is required." );
assert( ACCESS_TOKEN_PASSWORD, "ACCESS_TOKEN_PASSWORD configuration is required." );
assert( CRYPTO_ALGORITHM, "CRYPTO_ALGORITHM configuration is required." );
assert( CRYPTO_KEY, "CRYPTO_KEY configuration is required." );
assert( CRYPTO_IV, "CRYPTO_IV configuration is required." );

// export the configuration information
module.exports = {
    is_api:false,
    paths:{
         api: '/routes/api',
         authentication: '/routes/auth'
    },
    cookie:{
        email: ACCESS_TOKEN_EMAIL,
        password: ACCESS_TOKEN_PASSWORD,
        algorithm: CRYPTO_ALGORITHM,
        key: CRYPTO_KEY,
        initialization_vector: CRYPTO_IV
    },
    authentication:{
        secret: ACCESS_TOKEN_SECRET,
        time: ACCESS_TOKEN_LIFE,
        refresh: REFRESH_TOKEN_SECRET,
        refresh_time: REFRESH_TOKEN_LIFE
    },
    server: {
        port: HTTP_PORT,
        secure: {
            port: HTTPS_PORT,
            key: HTTPS_PFX,
            pass_phrase: HTTPS_PASSPHRASE
        }
    }
};