const config = require( "./config" );
const { Server } = require('./lib/');
const Database = require('./lib/database');

process.env.TZ = 'Africa/Nairobi';

const startServer = async () => {
    try {
        const app = new Server(__dirname, __dirname, config);
        const db = new Database(app);
        await app.start(db);
    } catch ( err ) {
        console.log( "startup error:", err );
    }
 };
 
 startServer();