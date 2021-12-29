const fs = require("fs");
const path = require('path');
const http = require("http");
const https = require("https");
const express = require("express");
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const xmlparser = require('express-xml-bodyparser');
const swagger_jsdoc = require('swagger-jsdoc');

class Server{

    constructor(root, ui_path, config) {
       this.config = config;
       this.extensions = [];
       this.root_path = root;
       this.ui_path = ui_path;
       this.libraries = require(path.join(this.ui_path +'/lib'));
       
       this.logger = this.libraries.logger;
       
       this.app = express();
       this.app.use(cookieParser());
       this.app.use(express.urlencoded({extended: true}));
       this.app.use(express.static(path.join(this.ui_path +'/public')));
       this.app.use(favicon(path.join(this.ui_path +'/public/img/favicon/favicon-32x32.png')));
       
       this.logger.use(this);

       const options = {
            swaggerDefinition:{
                openapi: "3.0.0",
                info: { 
                    title: this.config.id, 
                    version: '1.0.0', 
                    description: this.config.name+' API'
                },
                basePath: '/'
            },
            apis: [path.join(this.root_path +'/routes/*.js')],
        };
        this.apidoc = swagger_jsdoc(options);
        this.app.get('/api/'+this.config.id+'/apidoc', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(this.apidoc);
        });
    }

    async start(database){
        const server = this;            
        this.database = database;
        
        const views = require(path.join(this.ui_path +'/routes/views'));
        
        const server_listen = async (name, port, server, is_secure) =>{
            return new Promise((resolve, reject) => {
                try{
                    server.listen(port, () => {
                        const timestamp = this.logger.get_timestamp();
                        let console_text  = this.logger.console_color("\x1b[37m", `[`, "\x1b[0m");
                            console_text += this.logger.console_color("\x1b[32m", `${name || "ui"}`, "\x1b[0m");
                            console_text += this.logger.console_color("\x1b[37m", `] `, "\x1b[0m");
                            console_text += this.logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                            console_text += this.logger.console_color("\x1b[33m", `${is_secure ? 'HTTPS' : 'HTTP'} `, "\x1b[0m");
                            console_text += this.logger.console_color("\x1b[37m", `Server running `, "\x1b[0m");
                            console_text += this.logger.console_color("\x1b[32m", `${port} `, "\x1b[0m");
                           
                            this.logger.write(console_text+ (this.config.is_api ? "" : "\n"));
                            resolve();
                    });
                }
                catch(error){ reject(error); }
                
            });
        };
        
        const server_http = http.createServer(this.app);
        const server_https = https.createServer({ 
            pfx: fs.readFileSync(path.join(this.root_path + this.config.server.secure.key)),
            passphrase: this.config.server.secure.pass_phrase,
            requestCert: true, 
            rejectUnauthorized: false
        }, this.app);

        this.websocket = new this.libraries.WebSocket(this.config, server_https, this.logger);
        
        await server_listen(this.config.id, this.config.server.port, server_http, false);
        await server_listen(this.config.id, this.config.server.secure.port, server_https, true);        
        
        this.project = await this.database.connect();

        const api = require(path.join(this.root_path +this.config.paths.api));        

        if(this.config.is_api){
            this.app.use(xmlparser({ explicitArray: false, normalize: false, normalizeTags: false, trim: true }));
            this.app.use(express.json());

            const authentication = require(path.join(this.root_path +this.config.paths.authentication));
            await this.project.initialize_extensions(this, authentication, views);

            const ui = require(path.join(this.root_path +'/src/views/ui'));
            
            api.use(this);
            ui.use(this);
            
        }
        else {            
            api.use(this);
            views.use(this);
            
            this.app.use(xmlparser({ explicitArray: false, normalize: false, normalizeTags: false, trim: true }));
            this.app.use(express.json());
        }
    }
}

module.exports = Server;