const WebSocket = require('ws');
var { EventEmitter } = require('events');

class web_socket{
    constructor(config, server, logger) {
        this.events = new EventEmitter();

        const wss = new WebSocket.Server({ server: server });
        wss.on('connection', (ws) => {
            this.ws = ws;

            ws.on('message', async (message) => {
                this.events.emit('message', message);

                const timestamp = logger.get_timestamp();
                let console_text  = logger.console_color("\x1b[37m", `[`, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", `${config.name}`, "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `] `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[33m", `WS `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `${message} `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", `Message Received`, "\x1b[0m");
                    console.log(console_text);
              });
            
              ws.on('close', async () => {
                this.events.emit('close', null);

                const timestamp = logger.get_timestamp();
                let console_text  = logger.console_color("\x1b[37m", `[`, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", `${config.name}`, "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `] `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[33m", `WS `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `Connection `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", "Close", "\x1b[0m");
                    console.log(console_text);
              });
            
              ws.on('error', async (error) => {
                this.events.emit('error', error);

                const timestamp = logger.get_timestamp();
                let console_text  = logger.console_color("\x1b[37m", `[`, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", `${config.name}`, "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `] `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[33m", `WS `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `${error} `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", "Error", "\x1b[0m");
                    console.log(console_text);
              });

        });
    }

    send(message){
        if(this.ws != undefined && this.ws != null)this.ws.send(message);
    }

    onevent(key, func){
        if(this.events != undefined && this.events != null)this.events.on(key, func);
    }
}

module.exports = web_socket;