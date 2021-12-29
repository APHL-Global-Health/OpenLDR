//dependencies
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createProxyMiddleware, responseInterceptor  } = require('http-proxy-middleware');

const use = (server) => {
    try {
        const logger = server.logger;
        const child_processes = [];
        const dotenv = require('dotenv');

        const project_config = require(path.join(process.cwd() + `/package.json`));
        const projects_path = path.join(process.cwd() + `/api/projects/`);

        const getDirectories = source =>
              fs.readdirSync(source, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

        const dirs = getDirectories(projects_path);
        dirs.forEach((dir)=>{
            const name = dir;
            const project_path = path.join(projects_path + `/${name}`);
            const config = dotenv.parse(fs.readFileSync(path.join(project_path+'/.env')));
            
            const project_proxies = config.PROXIES.split(',').map(name=>{ return `/api/${name}`});
            var apiProxy = createProxyMiddleware( project_proxies, { 
                target: `http://127.0.0.1:${config.HTTP_PORT}`, 
                changeOrigin: true, 
                logLevel: 'silent',
                selfHandleResponse: true,
                ws: true,
                onProxyReq: async (proxyReq, req, res) => {
                    proxyReq.setHeader('x-proxy-method', req.method);
                    proxyReq.setHeader('x-proxy-protocol', req.protocol);
                    proxyReq.setHeader('x-proxy-host', req.get('host'));
                    proxyReq.setHeader('x-proxy-path', req.originalUrl);
                    proxyReq.setHeader('x-proxy-url', `${req.protocol}://${req.get('host')}${req.originalUrl}`);
                },
                onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
                    return responseBuffer;
                }),
                onError: async (err, req, res, target) => {
                   //
                },
                onProxyReqWs: async (proxyReq, req, socket, options, head) => {
                   //proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
                },
                onOpen: async (proxySocket) => {
                   // proxySocket.on('data', hybridParseAndLogMessage);
                },
                onClose: async (res, socket, head) => {
                   //console.log('Client disconnected');
                },
                logProvider: (provider) => {
                    return {
                        log: (msg)=>{ },
                        debug: (msg)=>{ },
                        info: (msg)=>{},
                        warn: (msg)=>{},
                        error: (msg)=>{},
                    };
                },
            });
            server.app.use(apiProxy);


            config.APPDATA = process.env.APPDATA;
            config.npm_config_user_agent = process.env.npm_config_user_agent;
            config.npm_node_execpath = process.env.npm_node_execpath;
            config.npm_config_noproxy = process.env.npm_config_noproxy;
            config.npm_config_userconfig = process.env.npm_config_userconfig;
            config.npm_config_metrics_registry = process.env.npm_config_metrics_registry;
            config.npm_config_prefix = process.env.npm_config_prefix;
            config.npm_config_cache = process.env.npm_config_cache;
            config.npm_config_node_gyp = process.env.npm_config_node_gyp;
            config.PATH = process.env.PATH;
            config.NODE = process.env.NODE;
            config.XDG_RUNTIME_DIR = process.env.XDG_RUNTIME_DIR;
            config.npm_config_globalconfig = process.env.npm_config_globalconfig;
            config.npm_config_init_module = process.env.npm_config_init_module;

            var cmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm'; 
            const respawn = spawned => {
                child_processes[name] = spawned;

                spawned.stdout.on('data', function (data) {    
                    let suppress = data.toString().trim().replace(/\u001b[^m]*?m/g,"").startsWith(`> ${project_config.name}@${project_config.version}`);
                    let _text = suppress ? data.toString().replace(/[\r\n]+/g," ") : data.toString();

                    let console_text = _text;
                    if(!console_text.replace(/\u001b[^m]*?m/g,"").startsWith(`[${name}]`)){
                        console_text  = logger.console_color("\x1b[37m", `[`, "\x1b[0m");
                        console_text += logger.console_color("\x1b[32m", `${name}`, "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `] ${_text} `, "\x1b[0m");
                    }
                    logger.write(console_text+"\n");
                });
                spawned.stderr.on('data', function(data) {
                    let suppress = data.toString().trim().replace(/\u001b[^m]*?m/g,"").startsWith(`> ${project_config.name}@${project_config.version}`);
                    let _text = suppress ? data.toString().replace(/[\r\n]+/g," ") : data.toString();

                    let console_text = _text;
                    if(!console_text.replace(/\u001b[^m]*?m/g,"").startsWith(`[${name}]`)){
                        console_text  = logger.console_color("\x1b[37m", `[`, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `${name}`, "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `] ${_text} `, "\x1b[0m");
                    }
                    logger.write(console_text+"\n");
                });
                spawned.on("error", function(err) {
                    let suppress = data.toString().trim().replace(/\u001b[^m]*?m/g,"").startsWith(`> ${project_config.name}@${project_config.version}`);
                    let _text = suppress ? data.toString().replace(/[\r\n]+/g," ") : data.toString();

                    let console_text = _text;
                    if(!console_text.replace(/\u001b[^m]*?m/g,"").startsWith(`[${name}]`)){
                        console_text  = logger.console_color("\x1b[37m", `[`, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `${name}`, "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `] ${_text} `, "\x1b[0m");
                    }
                    logger.write(console_text+"\n");
                });
                spawned.on('close', function (exitCode) {
                    const timestamp = logger.get_timestamp();
                    let console_text  = logger.console_color("\x1b[37m", `[`, "\x1b[0m");
                        console_text += logger.console_color("\x1b[32m", `${name}`, "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `] `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");                        
                        console_text += logger.console_color("\x1b[33m", "API".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `Exit Code `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", exitCode, "\x1b[0m");
                    console.log(console_text);

                    respawn(spawn(cmd, ['run', 'start'], { cwd: project_path, env: config }));
                });
            }
            respawn(spawn(cmd, ['run', `start:${name}`], { env: config }));

        });

        
    } catch (err) {
        console.log(err.message);
    }
};

module.exports = {use};