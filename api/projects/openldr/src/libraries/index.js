const path = require('path');
const root = path.join(__dirname +'/../../');
const { logger, mongo_helper, Server, WebSocket, Project } = require(path.join(root +'/../../../ui/lib'));
const Database = require('./database');

module.exports = {
    logger,
    mongo_helper,
    Server,
    WebSocket,
    Project,
    Database,
    root
}