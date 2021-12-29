const path = require('path');
const config = require( "./config" );
const { Server, Database, root } = require('./libraries/');

process.env.TZ = 'Africa/Nairobi';

const startServer = async () => {
    try {
        const ui = path.join(root +'/../../../ui');
        const app = new Server(root, ui, config);
        const db = new Database(app);
        await app.start(db);            
    } catch ( err ) {
        console.log( "startup error:", err );
    }
 };
 
 startServer();