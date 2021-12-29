
const colours = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        crimson: "\x1b[38m" // Scarlet
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        crimson: "\x1b[48m"
    }
};

const console_color  = (color, msg, reset) => {
    return `${color}${msg}${reset}`;
};

const get_timestamp  = () => {
    const date_ob = new Date();
    const date = ("0" + date_ob.getDate()).slice(-2);
    const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    const year = date_ob.getFullYear();
    const hours = ("0" + date_ob.getHours()).slice(-2);
    const minutes = ("0" + date_ob.getMinutes()).slice(-2);
    const seconds = ("0" + date_ob.getSeconds()).slice(-2);
  
    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};

const use = (server) => {
    const app = server.app;
    const id = server?.config?.id;
    
    if(id != undefined && id != null){
        app.use( ( req, res, next ) => {
            res.on( 'finish', () => {
                const timestamp = get_timestamp();
    
                let console_text  = console_color(colours.fg.white, `[`, colours.reset);
                    console_text += console_color(colours.fg.green, id, colours.reset);
                    console_text += console_color(colours.fg.white, `] `, colours.reset);
                    console_text += console_color(colours.fg.cyan, `${timestamp} `, colours.reset);
                    //console_text += console_color(colours.fg.yellow, req.method.padEnd(7), colours.reset);
                    console_text += console_color(colours.fg.yellow, `${req.method} `, colours.reset);
                    console_text += console_color(colours.fg.white,  `${req.protocol}://${req.get('host')}${req.originalUrl} `, colours.reset);
                    console_text += console_color(res.statusCode == 200 ? colours.fg.green : colours.fg.red,  `${res.statusCode} `, colours.reset);
        
                if(req._body){
                    console_text += console_color(colours.fg.white, `\n[`, colours.reset);
                    console_text += console_color(colours.fg.green, id, colours.reset);
                    console_text += console_color(colours.fg.white, `] `, colours.reset);
                    console_text += console_color(colours.fg.cyan, `${timestamp} `, colours.reset);
                    //console_text += console_color(colours.fg.magenta, "BODY".padEnd(7), colours.reset);
                    console_text += console_color(colours.fg.yellow, `BODY `, colours.reset);
                    console_text += console_color(colours.fg.white,  `${JSON.stringify(req.body)} `, colours.reset);
                }

                write(console_text);
            });
            next();
        });
    }
    
};

const write = (message) =>{
    process.stdout.write(message);
};

module.exports = { use, get_timestamp, colours, console_color, write };