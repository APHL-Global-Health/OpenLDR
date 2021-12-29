const fs = require("fs");
const path = require('path');

class Database{
    #server;

    constructor(server) {
        this.#server = server;
    }

    async #onconnected(){
        const Project = require(path.join(this.#server.ui_path +'/lib/project'));        
        return new Project();
    }

    async connect(){
        return await this.#onconnected();
    }
}

module.exports = Database;