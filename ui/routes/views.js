const fs = require('fs');
const url = require('url');
const path = require("path");
const crypto = require('crypto');
const dotenv = require('dotenv');
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const swagger_jsdoc = require('swagger-jsdoc');

const { rpc_server, is_configured, noLogin } = require('../lib/rpc_server');

const view_engine = require("../lib/view_engine");
const {div, span, button, script} = require("../components/tags");
const svg = require("../components/svg");
const table = require("../components/table");
const form = require("../components/form");

const config = process.env;
const projects = [];

let _apidoc = null;
let _project = null;
let _rendered = false;

const get_project = () => { return _project; };

const toJson = (status, data) => {
    return {
        Status : status,
        Data : data
    }
};

const bytesToSize = (bytes) => {
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (Math.round((bytes / Math.pow(1024, i)) * 10) / 10) + ' ' + sizes[i];
}

const create_options_section = (sections) => {
    const views = [];
    for(var x=0; x<sections.length; x++){  
        const section = sections[x];

        const links = [];
        for(var y=0; y<section.links.length; y++){  
            const link = section.links[y];

            const content = [];
            if(link.target == "_blank"){
                
                content.push(svg.create([ 
                    svg.line(7, 17, 17, 7),
                    svg.polyline("7 7 17 7 17 17")
                ]));
            }

            content.push(span({ "class":"sbui-menu__content" }, link.title));

            links.push(view_engine.createElement( "a", { "target":link.target, "href":link.url } ,[
                div({ 
                    "class":`sbui-menu__item${link.selected ? ' sbui-menu__item--active': ''}`,
                    "role":"menuitem"
                },[
                    span({ "class":"sbui-typography-text" },[
                        div({ "class":"sbui-space-row sbui-space-x-2" }, content),
                    ]),
                ]),
            ]));
        }

        views.push(div({ "class":"py-5 border-b dark:border-dark px-3" },[
            div({ "class":"sbui-menu__group" },[
                div({ "class":"sbui-space-row sbui-space-x-2" },[
                    span({ "class":"sbui-typography-text sbui-typography-text-secondary" },
                        section.title
                    )
                ]),
            ]),
            view_engine.createElement( "ul", null ,links),
        ]));
    }

    return views;
};

function getPathFromRegex(regexp) {
    return regexp.toString().replace('/^', '').replace('?(?=\\/|$)/i', '').replace(/\\\//g, '/');
}

const combineStacks = (acc, stack) =>{
    if (stack.handle.stack) {
        const routerPath = getPathFromRegex(stack.regexp);
        return [...acc, ...stack.handle.stack.map((stack) => ({ routerPath, ...stack }))];
    }
    return [...acc, stack];
}

const getRoutes = (app) =>{
    let stacks = null;
    let routes = new Set();
    // Express 3
    if (app.routes) {
        // convert to express 4
        stacks = Object.keys(app.routes)
            .reduce((acc, method) => [...acc, ...app.routes[method]], [])
            .map((route) => ({ route: { stack: [route] } }));
    }

    // Express 4
    if (stacks == null && app._router && app._router.stack) {
        stacks =  app._router.stack.reduce(combineStacks, []);
    }

    // Express 4 Router
    if (stacks == null && app.stack) {
        stacks =  app.stack.reduce(combineStacks, []);
    }

    // Express 5
    if (stacks == null && app.router && app.router.stack) {
        stacks = app.router.stack.reduce(combineStacks, []);
    }
  
    if (stacks) {
        for (const stack of stacks) {
            if (stack.route) {
                const routeLogged = {};
                for (const route of stack.route.stack) {
                    const method = route.method ? route.method.toUpperCase() : null;
                    if (!routeLogged[method] && method) {
                        const stackPath = [stack.routerPath, stack.route.path, route.path].filter((s) => !!s).join('');
                        if(!['/','/*'].includes(stackPath)){
                            const paths = [];
                            stackPath.split('/').forEach((p)=>{
                                if(p.trim().startsWith(':')){
                                    paths.push(`(?<${p.trim().substring(1)}>.*)`);
                                }
                                else paths.push(p);
                            });                                    
                            routes.add(paths.join('\\/'));
                        }
                        routeLogged[method] = true;
                    }
                }
            }
        }
    }

    return routes;
}

const getSetValueByIndex = (setObj, index) =>{ 
    return [...setObj][index]; 
};
  
const fetch_grid_data = async (name, options, project) =>{
    const { limit, page, query, sort, select } = options;


    var grid_rows = [];
    var grid_template_columns = "";
    var grid_row_width = 0;
    var grid_row_count = 1;

    const grid_header = [];

    var colindex = 1;
    grid_row_width += 65;
    grid_template_columns += "65px ";
    grid_header.push(div({ 
        "role":"columnheader",
        "aria-colindex":colindex,
        "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-frozen csofj7r71_0-beta_1",
        "style":`grid-column-start: ${colindex}; left: var(--frozen-left-0);`
    },[
        div({ "class":"sb-grid-select-cell__header" },[
            view_engine.createElement("input", { 
                "aria-label":"Select All",
                "type":"checkbox", 
                "class":"sb-grid-select-cell__header__input"
            }),
            button({ 
                "type":"button",
                "aria-haspopup":"sb-grid-select-cell__header",
                "class":"menu",
                "data-state":"closed",
                "class":"sbui-dropdown__trigger"
            },[
                span({ "class":"sbui-btn-container" }, [
                    span({ 
                        "class":"sbui-btn sbui-btn-text sbui-btn--tiny",
                        "style":"padding: 3px;",
                    }, [
                        svg.create([ 
                            svg.polyline("6 9 12 15 18 9")
                        ]),
                    ])
                ])
            ])
        ]),
    ]));

    colindex++;
    grid_row_width += 120;
    grid_template_columns += "120px ";
    grid_header.push(div({ 
        "role":"columnheader",
        "aria-colindex":colindex,
        "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-resizable c6l2wv171_0-beta_1 rdg-cell-frozen csofj7r71_0-beta_1 rdg-cell-frozen-last ch2wcw871_0-beta_1",
        "style":`grid-column-start: ${colindex}; left: var(--frozen-left-1);`
    },[
        div({ 
            "draggable":"true",
            "data-handler-id":"T145",
            "style":"opacity: 1;"
        },[
            div({ 
                "class":"sb-grid-column-header sb-grid-column-header--cursor"
            },[
                div({ "class":"sb-grid-column-header__inner" },[
                    div({ "class":"sb-grid-column-header__inner__primary-key" },[
                        svg.create([ 
                            svg.path("M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4")
                        ])
                    ]),
                    span({ "class":"sb-grid-column-header__inner__name" },"id"),
                    span({ "class":"sb-grid-column-header__inner__format" },"int8")
                ]),
                button({ 
                    "type":"button",
                    "aria-haspopup":"sb-grid-select-cell__header",
                    "class":"menu",
                    "data-state":"closed",
                    "class":"sbui-dropdown__trigger"
                },[
                    span({ "class":"sbui-btn-container" }, [
                        span({ 
                            "class":"sbui-btn sbui-btn-text sbui-btn--tiny",
                            "style":"padding: 3px;",
                        }, [
                            svg.create([ 
                                svg.polyline("6 9 12 15 18 9")
                            ])
                        ])
                    ])
                ])
            ]),
        ]),
    ]));

    const _columns_ref = [];
    const _schema = await project.get_table_schema(name);
    const data = await project.get_table_data(name, options);

    const count = data.count;
    const pages = data.pages;
    
    for(key in _schema){
        const { name, data_type } = _schema[key];

        if(name == '_id' && instance == 'ObjectID'){ }
        else if(name == '__v' && instance == 'Number'){ }
        else if(!select.includes(`-${name}`)){
            _columns_ref.push(name);

            colindex++;
            grid_row_width += 250;
            grid_template_columns += "250px ";
            grid_header.push(div({ 
                "role":"columnheader",
                "aria-colindex":colindex,
                "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-resizable c6l2wv171_0-beta_1",
                "style":`grid-column-start: ${colindex};`
            },[
                div({ 
                    "draggable":"true",
                    "data-handler-id":"T15",
                    "style":"opacity: 1;"
                },[
                    div({ 
                        "class":"sb-grid-column-header"
                    },[
                        div({ "class":"sb-grid-column-header__inner" },[
                            span({ "class":"sb-grid-column-header__inner__name" },name),
                            span({ "class":"sb-grid-column-header__inner__format" },data_type)
                        ]),
                        button({ 
                            "type":"button",
                            "aria-haspopup":"sb-grid-select-cell__header",
                            "class":"menu",
                            "data-state":"closed",
                            "class":"sbui-dropdown__trigger"
                        },[
                            span({ "class":"sbui-btn-container" }, [
                                span({ 
                                    "class":"sbui-btn sbui-btn-text sbui-btn--tiny",
                                    "style":"padding: 3px;",
                                }, [
                                    svg.create([ 
                                        svg.polyline("6 9 12 15 18 9")
                                    ])
                                ])
                            ])
                        ])
                    ]),
                ]),
            ]));
        }
    }

    grid_rows.push(div({ 
        "role":"row",
        "aria-rowindex":"1",
        "class":"rdg-header-row hz5s9zk71_0-beta_1"
    },grid_header));
   
    grid_row_count = data.data.length+1;

    for (var y=0; y<data.data.length; y++) {
        let row = data.data[y];

        var _colindex = 1;
        var _grid_row_width = 0;
        const _grid_header = [];
        var _grid_template_columns = "";

        _grid_row_width += 65;
        _grid_template_columns += "65px ";
        _grid_header.push(div({ 
            "role":"gridcell",
            "aria-readonly":"true",
            "aria-colindex":_colindex,
            "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-frozen csofj7r71_0-beta_1",
            "style":`grid-column-start: ${_colindex}; left: var(--frozen-left-0);`
        },[
            div({ "class":"sb-grid-select-cell__formatter" },[
                view_engine.createElement("input", { 
                    "aria-label":"Select",
                    "type":"checkbox", 
                    "class":"rdg-row__select-column__select-action"
                }),
                span({ "class":"sbui-btn-container" },[
                    button({ 
                        "class":"sbui-btn sbui-btn-text sbui-btn--tiny rdg-row__select-column__edit-action",
                        "style":"padding: 2px;"
                    },[
                        svg.create([ 
                            svg.polyline("15 3 21 3 21 9"),
                            svg.polyline("9 21 3 21 3 15"),
                            svg.line(21, 3, 14, 10),
                            svg.line(3, 21, 10, 14)
                        ])
                    ])
                ])
            ]),
        ]));

        _colindex++;
        _grid_row_width += 120;
        _grid_template_columns += "120px ";
        _grid_header.push(div({ 
            "role":"gridcell",
            "aria-selected":"false",
            "aria-readonly":"true",
            "aria-colindex":_colindex,
            "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-frozen csofj7r71_0-beta_1 rdg-cell-frozen-last ch2wcw871_0-beta_1",
            "style":`grid-column-start: ${_colindex}; left: var(--frozen-left-1);`
        },  (limit * (page-1))+(y+1)+"" ));

        for (var x=0; x<_columns_ref.length; x++) {
            let col = _columns_ref[x];

            if(col == '_id'){ }
            else if(col == '__v'){ }
            else {
                _colindex++;
                _grid_row_width += 250;
                _grid_template_columns += "250px ";
                _grid_header.push(div({ 
                    "role":"gridcell",
                    "aria-selected":"false",
                    "aria-readonly":"true",
                    "aria-colindex":_colindex,
                    "class":"rdg-cell cj343x071_0-beta_1",
                    "style":`grid-column-start: ${_colindex};`
                },row[col] != undefined && row[col] != null ? row[col].toString() : 'null'));
            }
        }

        grid_rows.push(div({ 
            "aria-selected":"false",
            "style":`top:${((y+1)*35)}px; --row-height:35px;`,
            "role":"row",
            "aria-rowindex":(y+2)+"",
            "class":"rdg-row r1upfr8071_0-beta_1 rdg-row-even"
        },_grid_header));
    }

    const render = div({ 
        "role":"grid",
        "aria-multiselectable":"true",
        "aria-colcount":colindex,
        "aria-rowcount":grid_row_count,
        "class":"rdg rnvodz571_0-beta_1",
        "style":`height: 100%; --header-row-height:35px; --row-width:${grid_row_width}px; --summary-row-height:35px; --template-columns:${grid_template_columns}; --frozen-left-0:0px; --frozen-left-1:65px;`
    }, grid_rows ).render();
    
    return {
        total: count,
        page: page,
        pageSize: pages,
        render: render,
        table_columns: _schema.map((s)=>{ return s.name; })
    };
                
}

const page = (contents) => {

    const filter_row = [];
    filter_row.push(div({"class":"sbui-dropdown-misc"}, [
        div({"class":"sb-grid-filter-row"}, [
            div({"class":"sb-grid-filter-row__inner"}, [
                span({"class":"sbui-btn-container"}, [
                    button({"class":"sbui-btn sbui-btn-text sbui-btn--tiny sb-grid-filter-row__inner__close sbui-btn--text-align-center"}, [
                        view_engine.createElement( "svg", { 
                            "xmlns":"http://www.w3.org/2000/svg",
                            "width":"14",
                            "height":"14",
                            "viewBox":"0 0 24 24",
                            "fill":"none",
                            "stroke":"currentColor",
                            "stroke-width":"1",
                            "stroke-linecap":"round",
                            "stroke-linejoin":"round",
                            "class":"sbui-icon"
                        },[
                            view_engine.createElement( "line", { "x1":"18", "y1":"6", "x2":"6", "y2":"18" }),
                            view_engine.createElement( "line", { "x1":"6", "y1":"6", "x2":"18", "y2":"18" })
                        ]),
                    ]),
                ]),
                button({
                    "type":"button",
                    "aria-haspopup":"menu",
                    "data-state":"closed",
                    "class":"sbui-dropdown__trigger"
                }, [
                    span({ "class":"sbui-btn-container" }, [
                        span({ "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" }, [
                            span(null, "TransID"),
                            view_engine.createElement( "svg", { 
                                "xmlns":"http://www.w3.org/2000/svg",
                                "width":"14",
                                "height":"14",
                                "viewBox":"0 0 24 24",
                                "fill":"none",
                                "stroke":"currentColor",
                                "stroke-width":"1",
                                "stroke-linecap":"round",
                                "stroke-linejoin":"round",
                                "class":"sbui-icon"
                            },[
                                view_engine.createElement( "polyline", { "points":"6 9 12 15 18 9" })
                            ]),
                        ]),
                    ]),
                ]),
                button({
                    "type":"button",
                    "aria-haspopup":"menu",
                    "data-state":"closed",
                    "class":"sbui-dropdown__trigger"
                }, [
                    span({ "class":"sbui-btn-container" }, [
                        span({ "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" }, [
                            span(null, "="),
                            view_engine.createElement( "svg", { 
                                "xmlns":"http://www.w3.org/2000/svg",
                                "width":"14",
                                "height":"14",
                                "viewBox":"0 0 24 24",
                                "fill":"none",
                                "stroke":"currentColor",
                                "stroke-width":"1",
                                "stroke-linecap":"round",
                                "stroke-linejoin":"round",
                                "class":"sbui-icon"
                            },[
                                view_engine.createElement( "polyline", { "points":"6 9 12 15 18 9" })
                            ]),
                        ]),
                    ]),
                ])
            ]),
            div(null, [
                div(null, [
                    div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive" }, [
                        div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                            div({ "class":"sbui-input-container" }, [
                                view_engine.createElement("input", { 
                                    "type":"text",
                                    "class":"sbui-input sbui-input--tiny",
                                    "value":"" 
                                })
                            ])
                        ])
                    ])
                ])
            ])
        ])
    ]));

    const view = view_engine.createElement("html", [
        view_engine.loadElement('../components/head', {
            title:"Kagaconnect Portal", 
            links:[
                view_engine.createElement("link", { "rel":"icon", "type":"image/png", "href":"/img/favicon/favicon-32x32.png"}),
                view_engine.createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/fonts.css"}),
                view_engine.createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/custom.css"}),
                view_engine.createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/tooltips.css"}),
                view_engine.createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/jquery.terminal.min.css"}),
                view_engine.createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/index.css"}),
                view_engine.createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/grid.css"})
            ], 
            scripts:[
                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/jquery-3.6.0.min.js"}),
                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/jquery.terminal.min.js"}),
                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/portal.js"}),

                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/Blob.js/Blob.js"}),
                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/FileSaver.js/src/FileSaver.min.js"}),
                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/Stuk-jszip/dist/2.6.1/jszip.min.js"}),
                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/js-xlsx/dist/xlsx.js"}),
                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/jsPDF/dist/jspdf.debug.js"})
            ] 
        }),
        view_engine.createElement("body", {"class":"dark"}, [
            div({ "class":"flex"}, contents)
        ])
    ]);

    return view;
};

const login = async (req, res, error, data) => {
    const cookie = req?.cookies?.Session;
    
    if(cookie != undefined && cookie != null){
        const decipher = crypto.createDecipheriv(process.env.CRYPTO_ALGORITHM, process.env.CRYPTO_KEY, Buffer.from(process.env.CRYPTO_IV, 'hex'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(cookie, 'hex')), decipher.final()]);
        
        const token = JSON.parse(decrpyted).access_token;
        
        if (!token) {
            res.clearCookie(`Session`);
            res.redirect('/');
        }
        else{
            try {
                
                const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
                render(req, res);
            } catch (err) {
                res.clearCookie(`Session`);
                res.redirect('/');
            }
        }
    }
    else {

        const buttons = [];

        var email ="";
        if(data != undefined && data != null && 
            data.hasOwnProperty('email'))
                email = data.email;

        buttons.push(div({ 
            "class":"form-group", 
            "style":"margin-top:8px; padding-left:0px;"
        },[
            view_engine.createElement( "input", {
                "type":"text",
                "name":"email",
                "placeholder":"Email",
                "class":`form-control email`,
                "value":email
            })
        ]));

        var password ="";
        if(data != undefined && data != null && 
            data.hasOwnProperty('password'))
            password = data.password;

        buttons.push(div({ 
            "class":"form-group", 
            "style":"margin-top:8px; padding-left:0px;"
        },[
            view_engine.createElement( "input", {
                "type":"password",
                "name":"password",
                "placeholder":"Password",
                "class":`form-control password`,
                "value":password
            })
        ]));

        buttons.push(button({  
            "type":"submit",
            "class":"c7e523d39",
            "style":"margin-top:8px; padding-left:0px;"
        },[
            view_engine.createElement( "input", {
                "type":"hidden",
                "name":"connection",
                "value":`custom`
            }),  
            span({
                "class":"c4a36d755",
                "style":"text-align:center; width:100%;"
            },`Continue`)
        ]));

        if(error != undefined && error != null){
            buttons.push(div({ 
                "class":"form-group error", 
                "style":"margin-top:8px; padding-left:0px; color: rgba(248,113,113, 1);"
            },error));

            buttons.push(
                script(()=>{
                        
                    window.onload = (event) => {
                        $('.form-group .email').keyup(function() {
                            $('.form-group.error').html('');
                        });

                        $('.form-group .password').keyup(function() {
                            $('.form-group.error').html('');
                        });
                    };
                    
                })
            )
        }
        
        
        const view = view_engine.createElement("html", [
            view_engine.loadElement('../components/head', {
                title:"Kagaconnect Portal", 
                links:[
                    view_engine.createElement("link", { "rel":"icon", "type":"image/png", "href":"/img/favicon/favicon-32x32.png"}),
                    view_engine.createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/main.cdn.min.css"}),
                    view_engine.createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/login.css"})
                ], 
                scripts:[
                    view_engine.createElement("script", { "type":"text/javascript", "src":"/script/jquery-3.6.0.min.js"}),
                ] 
            }),
            view_engine.createElement("body", null, [
                div({ "class":"c66541626 cfe5dbbc9" },[            
                    view_engine.createElement( "main", { "class":"c398d69cb login" },[
                        view_engine.createElement( "section", { "class":"cf7cb0683 _prompt-box-outer cd488bb40" },[
                            div({  "class":"cb158515f cc5801146" },[
                                div({  "class":"c835b06af" },[
                                    view_engine.createElement( "header", {  "class":"ca2efc7d8 c61e4fcc8" },[
                                        div({  
                                            "title":"supabase",
                                            "id":"custom-prompt-logo",
                                            "style":"width: auto !important; height: 60px !important; position: static !important; margin: auto !important; padding: 0 !important; background-color: transparent !important; background-position: center !important; background-size: contain !important; background-repeat: no-repeat !important"
                                        }),
                                        view_engine.createElement( "h1", {  
                                            "class":"c3fa29956 c926e5028"
                                        },"Welcome"),
                                        div({ "class":"c2077a76c cac95ad60" },[
                                            view_engine.createElement( "p", { "class":"c76075b34 c2fad6637" },
                                            "Log in to console.")
                                        ])
                                    ]),
                                    div({  "class":"c439d90a0 c37cd0ac8" },[
                                        div({  "class":"c0fe919b3 ce2119ffc" },[
                                            view_engine.createElement( "form", {  
                                                "method":"post",
                                                "action":"/authentication",
                                                "class":"cf6e9a30f cea5c3f32 c0a5aa0da"
                                            }, buttons )
                                        ])
                                    ])
                                ])
                            ])
                        ]) 
                    ])
                ])
            ])
        ]);

        res.status(200).send(view.render());

    }
};

const render = async (req, res) => { 

    const getDirectories = source =>
              fs.readdirSync(source, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)

    const projects_path = path.join(__dirname + `/../../api/projects/`);

    const views = [];
    const dirs = getDirectories(projects_path);
    dirs.forEach((dir)=>{
        const name = dir;
        const project_path = path.join(projects_path + `/${name}`);
        const config = dotenv.parse(fs.readFileSync(path.join(project_path+'/.env')));
        
        const location = config.PROJECT_LOCATION;
        const url = `${req.protocol}://${req.hostname}:${req.protocol == 'https' ? config.HTTPS_PORT : config.HTTP_PORT}`;

        views.push(view_engine.createElement( "li", { "class":"col-span-1 flex shadow-sm rounded-md" },[
            view_engine.createElement( "a", { 
                "class":"w-full col-span-3 md:col-span-1 ",
                "href":`${url}` 
            },[
                div({  "class":"bg-panel-header-light dark:bg-panel-header-dark  hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark  border border-border-secondary-light dark:border-border-secondary-dark  hover:border-border-secondary-hover-light dark:hover:border-border-secondary-hover-dark p-4 h-32 rounded  transition ease-in-out duration-150 flex flex-col justify-between" },[
                    view_engine.createElement( "h4", {  "class":"sbui-typography-title" }, `${dir}`),
                    div({  "class":"lowercase" },[
                        div({  "class":"sbui-typography-text" },`${location}`) 
                    ]) 
                ]) 
            ]) 
        ]));
    });

    const main_args = {
        breadcrumbs:['Projects'],
        views:[
            div({ "class":"p-4 w-full" },[
                div({ "class":"my-2" },[
                    div({ "class":"flex" },[
                        div( null,[
                            view_engine.createElement( "a", { 
                                "href":"/new/project", 
                                "type":"button", 
                                "aria-haspopup":"menu", 
                                "data-state":"closed", 
                                "class":"sbui-dropdown__trigger"
                            },[
                                span({ 
                                    "class":"sbui-btn-container"
                                },[
                                    span({ 
                                        "class":"sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center"
                                    },
                                    [ span(null,"New project") ])
                                ])
                            ])
                        ]) 
                    ])
                ]),
                div({ "class":"my-8 space-y-8" },[
                    div( null,[
                        view_engine.createElement( "ul", { 
                            "class":"grid grid-cols-1 gap-4 mx-auto w-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, 
                            views
                        )
                    ]) 
                ])
            ]),
        ]
    };

    const view = page([
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const project = async (req, res, project) => {
    _rendered = true;
    
    if(project != undefined && project != null){
        const selected_page = "Home";

        const sidebar_args = { project, selected_page };
        const main_args = { 
            project, 
            selected_page, 
            breadcrumbs:['Projects', project.get_name()],
            views:[]
        };

        const view = page([
            view_engine.loadElement('../components/sidebar', sidebar_args),
            view_engine.loadElement('../components/main', main_args)
        ]);

        res.status(200).send(view.render());
    }
    else res.redirect('/');
};

const editor_table = async (req, res, project) => {
    
    const project_id = "";
    const selected_page = "Table Editor";

    var active_table=0;
    var tables = [];
    
    tables.push(div({ "class":"sbui-menu__group" },[
        div({ "class":"sbui-space-row sbui-space-x-2" },[
            span({ "class":"sbui-typography-text sbui-typography-text-secondary" },"All tables")
        ])
    ]));


    const collections = await project.get_tables();
    
    var grid_rows = [];
        
    for (var c=0; c<collections.length; c++) {
        let name = collections[c];

        if(active_table == c){               
            tables.push(div({ 
                "class":"sbui-menu__item sbui-menu__item--active sbui-menu__item--rounded",
                "data-project":project_id  
            },[
                span({ "class":"sbui-typography-text" },[
                    div({ "class":"sbui-space-row sbui-space-x-2" },[
                        span({ "class":"sbui-menu__content w-full" },[
                            div({ "class":"flex justify-between" },[
                                span({ "class":"truncate", "style":"opacity: 1;" },name),
                                button({ 
                                    "type":"button",
                                    "aria-haspopup":"menu",
                                    "data-state":"closed",
                                    "class":"sbui-dropdown__trigger"
                                },[
                                    span({ "class":"sbui-btn-container" },[
                                        span({ 
                                            "style":"padding: 3px;",
                                            "class":"sbui-btn sbui-btn-text sbui-btn--tiny sbui-btn--text-align-center" 
                                        },[
                                            svg.create([ 
                                                svg.polyline("6 9 12 15 18 9")
                                            ])
                                        ]) 
                                    ])                                                                               
                                ])
                            ])
                        ])
                    ])
                ])
            ]));
        }
        else{
            tables.push(div({ 
                "class":"sbui-menu__item sbui-menu__item--rounded",
                "data-project":project_id 
            },[
                span({ "class":"sbui-typography-text" },[
                    div({ "class":"sbui-space-row sbui-space-x-2" },[
                        span({ "class":"sbui-menu__content w-full" },[
                            div({ "class":"flex justify-between" },[
                                span({ "class":"truncate", "style":"opacity: 1;" },name)
                            ])
                        ])
                    ])
                ])
            ]));
        }
    }

    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Tables",
        views:[
            div({  
                "role":"menu",
                "aria-orientation":"vertical",
                "aria-labelledby":"options-menu"
            },[
                div({  "class":"mt-8" },[
                    div({ 
                        "role":"menu",
                        "aria-orientation":"vertical",
                        "aria-labelledby":"options-menu", 
                        "class":"mb-4" 
                    },[                     
                        div({ "class":"mt-4 px-3 space-y-4" },[
                            div( null, tables)
                        ])
                    ]) 
                ]) 
            ]) 
        ]
    };


    const _schema = await project.get_table_schema(collections[active_table]);
    const script_options = {
        compress: {
            dead_code: true,
            global_defs: {
                TABLE_COLS: _schema.map((s)=>{ return s.name; }),
                JOINING_VALS:[
                    { symbol:" AND ", description: "join statements with 'AND'" },
                    { symbol:" OR ", description: "join statements with 'OR'" },
                    { symbol:" AND ( ", description: "join with 'AND ('" },
                    { symbol:" OR ( ", description: "join with 'OR ('" },
                    { symbol:" ) AND ", description: "join with ') AND'" },
                    { symbol:" ) OR ", description: "join with ') OR'" },
                    { symbol:" ( ", description: "open parentheses" },
                    { symbol:" ) ", description: "close parentheses" }
                ],
                FILTER_VALS:[
                    { symbol:" = ", description: "equals" },
                    { symbol:"&lt;&gt;", description: "not equal" },
                    { symbol:" &gt; ", description: "greater than" },
                    { symbol:" &lt; ", description: "less than" },
                    { symbol:"&gt;=", description: "greater than or equal" },
                    { symbol:"&lt;=", description: "less than or equal" },
                    { symbol:"~~", description: "like operator" },
                    { symbol:"~~*", description: "not like operator" },
                    { symbol:" in ", description: "one of a list of values" },
                    { symbol:" nin ", description: "not in the list of values" }
                ]
            }
        }
    };
    
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name()],
        views:[
            div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col"},[
                div({ "class":"relative"}),
                div({ "class":"sb-grid"},[
                    div({ "class":"sb-grid-header"},[
                        div({ "class":"sb-grid-header__inner"},[
                            div({ "class":"sbui-input-container" },[
                                span({ "class":"sbui-btn-container" }, [
                                    button({ 
                                        "class":"Filter-Refresh sbui-btn sbui-btn-text sbui-btn--tiny",
                                        "style":"padding-left: 4px; padding-right: 4px;" 
                                    }, [
                                        svg.create([ 
                                            svg.polyline("23 4 23 10 17 10"),
                                            svg.polyline("1 20 1 14 7 14"),
                                            svg.path("M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15")
                                        ]),
                                        div(null ,"Refresh")
                                    ])
                                ]),
                                button({ 
                                    "type":"button",
                                    "aria-haspopup":"menu",
                                    "data-state":"closed",
                                    "class":"Filter-button sbui-dropdown__trigger",
                                    "style":"margin-top:2px; margin-bottom:1px;",
                                }, [
                                    span({ "class":"sbui-btn-container" }, [
                                        span({ "class":"sbui-btn sbui-btn-text sbui-btn--tiny" }, [
                                            svg.create([ 
                                                svg.polyline("22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3")
                                            ]),
                                            span(null, "Filter")
                                        ])
                                    ])
                                ])
                            ])
                        ]),
                        div({ "class":"sb-grid-header__inner"},[
                
                        ]),
                    ]),
                    div({ 
                        "class":"sb-grid-body",
                        "style":"width: 100%; height: 100%;"
                    }, grid_rows ),
                    div({ "class":"sb-grid-footer"},[
                        div({ "class":"sb-grid-footer__inner"},[
                            div({ "class":"sb-grid-pagination"},[
                                span({ "class":"sbui-btn-container"},[
                                    button({ 
                                        "disabled":"true",
                                        "style":"padding: 3px 10px;",
                                        "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny  page-down-btn"
                                    },[
                                        svg.create([ 
                                            svg.line(19, 12, 5, 12),
                                            svg.polyline("12 19 5 12 12 5")
                                        ])
                                    ])
                                ]),
                                span({ "class":"sbui-typography-text"},"Page"),
                                div({ "class":"sb-grid-pagination-input-container"},[
                                    div({ "class":"sb-grid-pagination-input"},[
                                        div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive"},[
                                            div({ 
                                                "class":"sbui-formlayout__content-container-horizontal",
                                                "style":"width: 3rem;" 
                                            },[
                                                div({ "class":"sbui-inputnumber-container" },[
                                                    view_engine.createElement("input", {
                                                            "type":"number",
                                                            "class":"sbui-inputnumber sbui-inputnumber--tiny page-number",
                                                            "min":"1",
                                                            "max":"1",
                                                            "value":"1",
                                                    }),
                                                    div({ "class":"sbui-inputnumber-nav sbui-inputnumber-nav--tiny" },[
                                                        svg.create([ 
                                                            svg.polyline("18 15 12 9 6 15")
                                                        ],{"width":"21", "height":"21","class":"sbui-icon sbui-inputnumber-button sbui-inputnumber-button-up"}),
                                                        svg.create([ 
                                                            svg.polyline("6 9 12 15 18 9")
                                                        ],{"width":"21", "height":"21","class":"sbui-icon sbui-inputnumber-button sbui-inputnumber-button-down"})
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                    ]),
                                ]),
                                span({ "class":"sbui-typography-text pages-total"},"of 1"),
                                span({ "class":"sbui-btn-container"},[
                                    button({ 
                                        "disabled":"true",
                                        "style":"padding: 3px 10px;",
                                        "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny page-up-btn"
                                    },[
                                        svg.create([ 
                                            svg.line(5, 12, 19, 12),
                                            svg.polyline("12 5 19 12 12 19")
                                        ])
                                    ])
                                ]),
                                button({ 
                                    "type":"button",
                                    "aria-haspopup":"menu",
                                    "data-state":"closed",
                                    "class":"sbui-dropdown__trigger"
                                },[
                                    span({ "class":"sbui-btn-container"},[
                                        span({ 
                                            "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny pages-limit",
                                            "style":"padding: 3px 10px;"
                                        },[
                                            span(null ,"100 rows")
                                        ])
                                    ])
                                ]),
                                span({ "class":"sbui-typography-text pages-count"},"0 records"),
                                
                            ]),
                        ]),
                    ]),
                ]),
            ]),
            script(()=>{ 
                const filters = [];
                let table_columns = TABLE_COLS;
                
                const getFilters = () => {
                    var parameters = null;
                    var _filter = filters;

                    const selected = $(".sbui-menu__item.sbui-menu__item--active.sbui-menu__item--rounded .truncate");
                    if(selected != undefined && selected != null){
                        _filter = _filter.filter((f)=>{ return f.table == selected.text()});                        
                    }

                    if(_filter.length > 0)parameters = "";

                    _filter.forEach((f, i)=>{
                        const _value = f.value;
                        const _itemSelector = f.column;
                        const _equilazerSelector = getEqualizer(f.operator);
                        if(_equilazerSelector != null && 
                            _itemSelector != undefined && _itemSelector != null && _itemSelector.length > 0 &&
                            _value != undefined && _value != null && _value.length > 0){
                            if(i == 0){
                                parameters += _itemSelector+"="+_equilazerSelector+"."+f.value;
                            }
                            else{
                                const _andOrSelector = getSelector(f.join);
                                if(_andOrSelector != undefined && _andOrSelector != null && _andOrSelector.length > 0)
                                    parameters += "&"+_itemSelector+"."+_andOrSelector+"="+_equilazerSelector+"."+f.value;
                            }
                        }                                
                    });

                    return parameters;
                };

                const getSelector = (value) => {
                    if(value == undefined || value == null)return null;

                    value = value.trim();

                    if(value == "AND") return "and";
                    else if(value == "OR") return "or";
                    else if(value == "AND (") return "parentheses.open.and";
                    else if(value == "OR (") return "parentheses.open.or";
                    else if(value == ") AND") return "parentheses.close.and";
                    else if(value == ") OR") return "parentheses.close.or";
                    else if(value == "(") return "parentheses.open";
                    else if(value == ")") return "parentheses.close";
                    return null;
                };

                const getEqualizer = (value) => {
                    if(value == undefined || value == null)return null;

                    value = value.trim();

                    if(value == "=") return "eq";
                    else if(value == "<>") return "nq";
                    else if(value == "~~") return "lk";
                    else if(value == "!~~") return "nl";
                    else if(value == ">") return "gt";
                    else if(value == ">=") return "ge";
                    else if(value == "<") return "lt";
                    else if(value == "<=") return "le";
                    else if(value == "in") return "in";
                    else if(value == "nin") return "ni";
                    return null;
                };
                
                function create_menu_item(value){
                    const menu_content = $(document.createElement('span'));
                    menu_content.append(`${value} rows`);
                
                    const menu_item = $(document.createElement('div'));
                    menu_item.addClass("sbui-dropdown-item");
                    menu_item.attr({
                        "role": "menuitem",
                        "tabindex": "-1", 
                        "data-orientation": "vertical"
                    });
                    menu_item.append(menu_content);

                    menu_item.unbind( "click" );
                    menu_item.click(function() {
                        const limit = $(this).text().replace(" rows","");
                        const current_limit = $('.pages-limit').text().replace(" rows","");

                        if(current_limit != limit){
                            $('.pages-limit').html(`<span>${limit} rows</span>`);

                            const item = $('.sbui-menu__item.sbui-menu__item--active');
                            setup_paging(item);
                        }
                    });
                    
                    return menu_item;
                }
                
                function create_menu_option(value, item, selected, index){
                    const menu_content = $(document.createElement('span'));
                    menu_content.append(value);
                
                    const menu_item = $(document.createElement('div'));
                    menu_item.addClass("sbui-dropdown-item");
                    menu_item.attr({
                        "role": "menuitem",
                        "tabindex": "-1", 
                        "data-orientation": "vertical"
                    });
                    menu_item.append(menu_content);

                    menu_item.unbind( "click" );
                    menu_item.click(function() {

                        const dt_id = $(item).parents(".dropdown-filter-parent").attr("id");
                        if(dt_id != undefined && dt_id != null){
                            const _filter = filters.find((f)=>{ return f.id == dt_id});
                            if(_filter != undefined && _filter != null){
                                if(index == 0)_filter.join = selected.trim();
                                else if(index == 1)_filter.column = selected;
                                else if(index == 2)_filter.operator = $("<textarea/>").html(selected).text().trim();
                            }
                        }
                        
                        item.html(selected);
                    });
                    
                    
                    return menu_item;
                }
                
                function load_grid_data( table, project, options, callback){
                    var url = `/project/editor/table`;                                         
                    var timeout = 1000*60*5;
                           
                    fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: table,
                            options:options
                        })
                    }, timeout)
                    .then((response) => {
                        if (response.ok) return response.json();
                        else {
                            throw new Error(response.text());
                        }
                    })
                    .then(data =>{
                        if(callback != undefined && callback != null)callback(data);
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
                }
                
                function setup_paging(item, callback){
                    $(".sb-grid-body").html('');
                
                    const project = item.attr("data-project");
                    const table = item.text();
                
                    const pages_limit = $('.pages-limit');
                    const page_number = $('.page-number');
                    const page_up = $('.page-up-btn');
                    const page_down = $('.page-down-btn');
                
                    page_number.val('1');
                
                    const parameters = getFilters();

                    const options = {
                        limit:parseInt(pages_limit.text().replace(" rows","")),
                        page:parseInt(page_number.val()),
                        query:parameters,
                        sort:{},
                        select: ''
                    };
                        
                    load_grid_data( table, project, options, (data)=>{
                        table_columns = data.table_columns;

                        page_number.attr("max",data.pageSize);
                        page_number.attr("value",data.page);
                
                        if(data.page != 1) page_down.removeAttr("disabled");
                        else page_down.prop("disabled",true);
                
                        if(data.page != data.pageSize) page_up.removeAttr("disabled");
                        else page_up.prop('disabled', true);  
                
                        $(".pages-total").html(`of ${data.pageSize}`); 
                        $(".pages-count").html(`${data.total} record${data.total == 1 ? '' : 's'}`); 
                        $(".sb-grid-body").html(data.render); 
                        
                        if(callback != undefined && callback != null)callback(data);
                    });
                
                    page_up.unbind( "click" );
                    page_up.click(function() {        
                        const _page = parseInt(page_number.val());
                        const _min = parseInt(page_number.attr("min"));
                        const _max = parseInt(page_number.attr("max"));
                        
                        if(_page < _max){
                            options.limit = parseInt(pages_limit.text().replace(" rows",""));
                            options.page = _page+1;
                            page_number.val(_page+1);
                
                            if(_page-1 != _min) page_down.removeAttr("disabled");
                            else page_down.attr("disabled",_page == _min);
                
                            if(_page+1 != _max) page_up.removeAttr("disabled");
                            else page_up.attr("disabled",_page == _max);
                
                            $(".sb-grid-body").html('');
                            load_grid_data( table, project, options, (data)=>{
                                table_columns = data.table_columns;

                                page_number.attr("max",data.pageSize);
                                page_number.val(data.page); 
                                
                                if(data.page != _min) page_down.removeAttr("disabled");
                                else page_down.prop("disabled",true);
                
                                if(data.page != data.pageSize) page_up.removeAttr("disabled");
                                else page_up.prop('disabled', true);                
                
                                $(".pages-total").html(`of ${data.pageSize}`); 
                                $(".pages-count").html(`${data.total} record${data.total == 1 ? '' : 's'}`); 
                                $(".sb-grid-body").html(data.render);  
                            });
                        }
                    });
                
                    page_down.unbind( "click" );
                    page_down.click(function() {
                        const _page = parseInt(page_number.val());
                        const _min = parseInt(page_number.attr("min"));
                        const _max = parseInt($(this).attr("max"));
                
                        if(_page > _min){
                            options.limit = parseInt(pages_limit.text().replace(" rows",""));
                            options.page = _page-1;
                            page_number.val(_page-1);
                
                            if(_page-1 != _min) page_down.removeAttr("disabled");
                            else page_down.attr("disabled",_page == _min);
                
                            if(_page+1 != _max) page_up.removeAttr("disabled");
                            else page_up.attr("disabled",_page == _max);
                
                            $(".sb-grid-body").html('');
                            load_grid_data( table, project, options, (data)=>{
                                table_columns = data.table_columns;

                                page_number.attr("max",data.pageSize);  
                                page_number.val(data.page);     
                                
                                if(data.page != _min) page_down.removeAttr("disabled");
                                else page_down.prop("disabled",true);
                
                                if(data.page != data.pageSize) page_up.removeAttr("disabled");
                                else page_up.prop('disabled', true); 
                
                                $(".pages-total").html(`of ${data.pageSize}`); 
                                $(".pages-count").html(`${data.total} record${data.total == 1 ? '' : 's'}`); 
                                $(".sb-grid-body").html(data.render);          
                            });
                        }
                    });
                }

                $('.sbui-menu__item').unbind( "click" );
                $('.sbui-menu__item').click(function() {
                    if(!$(this).hasClass('_deactivate_')){
                        $(this).addClass('_deactivate_');
                        
                
                        const parent = $('.sbui-menu__item').parent();
                
                        parent.find('.sbui-menu__item').each(function() {
                            $(this).removeClass('sbui-menu__item--active');
                            $(this).removeClass('sbui-menu__item--rounded');
                            $(this).addClass('sbui-menu__item--rounded');
                
                            $(this).find('button').remove();
                        });
                
                        $(this).removeClass('sbui-menu__item--rounded');
                        $(this).addClass('sbui-menu__item--active');
                        $(this).addClass('sbui-menu__item--rounded');
                
                        $(this).find('.sbui-menu__content').children().first().append('<button type="button" aria-haspopup="menu" data-state="closed" class="sbui-dropdown__trigger"><span class="sbui-btn-container"><span style="padding: 3px;" class="sbui-btn sbui-btn-text sbui-btn--tiny sbui-btn--text-align-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><polyline points="6 9 12 15 18 9"></polyline></svg></span></span></button>');
                
                        const item =  $(this);
                        setup_paging(item, (data)=>{
                            $(this).removeClass('_deactivate_');
                        });
                    }
                });

                $('.pages-limit').parents('button').unbind( "click" );
                $('.pages-limit').parents('button').click(function(event) {
                    event.stopPropagation();

                    removePopups('.popup_container');

                    const values = [100,500,1000];
                    
                    const dropdown_control = $(document.createElement('div'));
                    dropdown_control.addClass("dropdown-control");
                    dropdown_control.css({ "max-height": "30vh", "overflow": "auto" });
                    
                    values.forEach((value)=>{
                        dropdown_control.append(create_menu_item(value));
                    });
                    
                    const menu = $(document.createElement('div'));
                    menu.addClass("sbui-dropdown__content");
                    menu.attr({
                        "role": "menu", 
                        "dir": "ltr", 
                        "data-state": "open", 
                        "tabindex": "-1", 
                        "aria-orientation": "vertical", 
                        "data-orientation": "vertical", 
                        "data-side": "top", 
                        "data-align": "start"
                    });
                    menu.css({
                        "outline": "none", 
                        "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)", 
                        "pointer-events": "auto"
                    });
                    menu.append(dropdown_control);
                    
                    const container = $(document.createElement('div'));
                    container.css({
                        "position": "absolute", 
                        "bottom": "34px", 
                        "left": "572px", 
                        "min-width": "max-content",
                        "will-change": "transform",
                        "--radix-popper-transform-origin": "0px 86px"
                    });
                    container.append(menu);
                    
                    const popup = $(document.createElement('div')).appendTo('body');
                    popup.addClass("popup_container");
                    popup.css({"position": "absolute", "bottom": "0px", "left": "0px", "z-index": "2147483647"});
                    popup.append(container);
                    
                });

                $('.Filter-Refresh').unbind( "click" );
                $('.Filter-Refresh').click(function() {
                    const item = $('.sbui-menu__item.sbui-menu__item--active');
                    setup_paging(item);
                });

                $('.Filter-button').unbind( "click" );
                $('.Filter-button').click(function(event) {
                    event.stopPropagation();

                    const top_part = $(document.createElement('div'));
                    top_part.addClass("overflow-y-auto");
                    top_part.css({ "max-height": "256px" });

                    const separator_part = $(document.createElement('div'));
                    separator_part.addClass("sbui-divider");
                    separator_part.addClass("sbui-divider--light");
                    separator_part.addClass("sbui-divider--no-text");
                    separator_part.attr({ "role": "seperator" });

                    const bottom_part_span_button_filter = $(document.createElement('button'));
                    bottom_part_span_button_filter.addClass("sbui-btn");
                    bottom_part_span_button_filter.addClass("sbui-btn-text");
                    bottom_part_span_button_filter.addClass("sbui-btn--tiny");
                    bottom_part_span_button_filter.addClass("sbui-btn--text-align-center");
                    bottom_part_span_button_filter.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>');
                    bottom_part_span_button_filter.append('<span>Add filter</span>');

                    const bottom_part_span_button_search = $(document.createElement('button'));
                    bottom_part_span_button_search.addClass("sbui-btn");
                    bottom_part_span_button_search.addClass("sbui-btn-text");
                    bottom_part_span_button_search.addClass("sbui-btn--tiny");
                    bottom_part_span_button_search.addClass("sbui-btn--text-align-center");
                    bottom_part_span_button_search.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>');
                    bottom_part_span_button_search.append('<span>Search</span>');

                    const bottom_part_span_filter = $(document.createElement('span'));
                    bottom_part_span_filter.addClass("sbui-btn-container");
                    bottom_part_span_filter.append(bottom_part_span_button_filter);

                    
                    const bottom_part_span_separator = $(document.createElement('span'));
                    bottom_part_span_separator.addClass("sbui-btn-container");

                    const bottom_part_span_search = $(document.createElement('span'));
                    bottom_part_span_search.addClass("sbui-btn-container");
                    bottom_part_span_search.append(bottom_part_span_button_search);

                    const bottom_part = $(document.createElement('div'));
                    bottom_part.addClass("sbui-dropdown-misc");
                    bottom_part.css({
                        "display": "grid",
                        "grid-template-columns": "auto 1fr auto"
                    });
                    bottom_part.append(bottom_part_span_filter);
                    bottom_part.append(bottom_part_span_separator);
                    bottom_part.append(bottom_part_span_search);

                    const menu = $(document.createElement('div'));
                    menu.addClass("sbui-popover__content");
                    menu.addClass("sb-grid-filter-popover");
                    menu.attr({
                        "role": "dialog", 
                        "data-state": "open", 
                        "tabindex": "-1", 
                        "data-side": "bottom", 
                        "data-align": "start"
                    });
                    menu.css({
                        "--radix-popover-content-transform-origin": "var(--radix-popper-transform-origin)", 
                        "pointer-events": "auto"
                    });
                    menu.append(top_part);
                    menu.append(separator_part);
                    menu.append(bottom_part);

                    const dropdown_control = $(document.createElement('div'));
                    dropdown_control.addClass("dropdown-control");
                    dropdown_control.css({ "max-height": "256px", "overflow": "auto" });
                    
                    
                    const container_overlay = $(document.createElement('div'));
                    container_overlay.addClass("sbui-dropdown__content");
                    container_overlay.attr({
                        "role": "menu", 
                        "dir": "ltr", 
                        "data-state": "open", 
                        "tabindex": "-1", 
                        "aria-orientation": "vertical", 
                        "data-orientation": "vertical", 
                        "data-side": "top", 
                        "data-align": "start"
                    });
                    container_overlay.css({
                        "outline": "none", 
                        "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)", 
                        "pointer-events": "auto",
                        "max-height": "256px",
                        "top": "0px" ,
                        "left": "0px",
                        "position": "absolute" 
                    });
                    container_overlay.append(dropdown_control);

                    const container = $(document.createElement('div'));
                    container.css({
                        "position": "absolute", 
                        "top": "0px", 
                        "left": "0px", 
                        "transform": "translate3d(410px, 84px, 0px)", 
                        "min-width": "max-content",
                        "will-change": "transform",
                        "--radix-popper-transform-origin": "0px 0px"
                    });
                    container.append(menu);
                    container.append(container_overlay);
                    
                    const popup = $(document.createElement('div')).appendTo('body');
                    popup.addClass("popup_container");
                    popup.css({"position": "absolute", "top": "0px", "left": "0px", "z-index": "2147483647"});
                    popup.append(container);

                    const show_filter = (f) => {
                        const filter_container_grid_info_span_button = $(document.createElement('div'));
                        filter_container_grid_info_span_button.addClass("sbui-btn");
                        filter_container_grid_info_span_button.addClass("sbui-btn-text");
                        filter_container_grid_info_span_button.addClass("sbui-btn--tiny");
                        filter_container_grid_info_span_button.addClass("sb-grid-filter-row__inner__close");
                        filter_container_grid_info_span_button.addClass("sbui-btn--text-align-center");
                        filter_container_grid_info_span_button.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>');

                        const filter_container_grid_info_span = $(document.createElement('div'));
                        filter_container_grid_info_span.addClass("sbui-btn-container");
                        filter_container_grid_info_span.append(filter_container_grid_info_span_button);

                        const fcgib_0_span_child = $(document.createElement('span'));
                        fcgib_0_span_child.addClass("sbui-btn");
                        fcgib_0_span_child.addClass("sbui-btn-outline");
                        fcgib_0_span_child.addClass("sbui-btn-container--shadow");
                        fcgib_0_span_child.addClass("sbui-btn--tiny");
                        fcgib_0_span_child.addClass("sbui-btn--text-align-center");
                        fcgib_0_span_child.append(`<span class="item-info-join">${f.join}</span>`);
                        fcgib_0_span_child.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><polyline points="6 9 12 15 18 9"/></svg>');

                        const fcgib_0_span = $(document.createElement('span'));
                        fcgib_0_span.addClass("sbui-btn-container");
                        fcgib_0_span.append(fcgib_0_span_child);

                        const filter_container_grid_info_button_0 = $(document.createElement('div'));
                        filter_container_grid_info_button_0.addClass("sbui-dropdown__trigger");
                        filter_container_grid_info_button_0.attr({
                            "type": "button", 
                            "aria-haspopup": "menu", 
                            "data-state": "closed"
                        });
                        filter_container_grid_info_button_0.append(fcgib_0_span);

                        const fcgib_1_span_child = $(document.createElement('span'));
                        fcgib_1_span_child.addClass("sbui-btn");
                        fcgib_1_span_child.addClass("sbui-btn-outline");
                        fcgib_1_span_child.addClass("sbui-btn-container--shadow");
                        fcgib_1_span_child.addClass("sbui-btn--tiny");
                        fcgib_1_span_child.addClass("sbui-btn--text-align-center");
                        fcgib_1_span_child.append(`<span class="item-info-column">${f.column}</span>`);
                        fcgib_1_span_child.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><polyline points="6 9 12 15 18 9"/></svg>');

                        const fcgib_1_span = $(document.createElement('span'));
                        fcgib_1_span.addClass("sbui-btn-container");
                        fcgib_1_span.append(fcgib_1_span_child);

                        const filter_container_grid_info_button_1 = $(document.createElement('div'));
                        filter_container_grid_info_button_1.addClass("sbui-dropdown__trigger");
                        filter_container_grid_info_button_1.attr({
                            "type": "button", 
                            "aria-haspopup": "menu", 
                            "data-state": "closed"
                        });
                        filter_container_grid_info_button_1.append(fcgib_1_span);

                        const fcgib_2_span_child = $(document.createElement('span'));
                        fcgib_2_span_child.addClass("sbui-btn");
                        fcgib_2_span_child.addClass("sbui-btn-outline");
                        fcgib_2_span_child.addClass("sbui-btn-container--shadow");
                        fcgib_2_span_child.addClass("sbui-btn--tiny");
                        fcgib_2_span_child.addClass("sbui-btn--text-align-center");
                        fcgib_2_span_child.append(`<span class="item-info-operator">${f.operator}</span>`);
                        fcgib_2_span_child.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><polyline points="6 9 12 15 18 9"/></svg>');

                        const fcgib_2_span = $(document.createElement('span'));
                        fcgib_2_span.addClass("sbui-btn-container");
                        fcgib_2_span.append(fcgib_2_span_child);

                        const filter_container_grid_info_button_2 = $(document.createElement('div'));
                        filter_container_grid_info_button_2.addClass("sbui-dropdown__trigger");
                        filter_container_grid_info_button_2.attr({
                            "type": "button", 
                            "aria-haspopup": "menu", 
                            "data-state": "closed"
                        });
                        filter_container_grid_info_button_2.append(fcgib_2_span);

                        const filter_container_grid_info = $(document.createElement('div'));
                        filter_container_grid_info.addClass("sb-grid-filter-row__inner");
                        filter_container_grid_info.append(filter_container_grid_info_span);
                        filter_container_grid_info.append(filter_container_grid_info_button_0);
                        filter_container_grid_info.append(filter_container_grid_info_button_1);
                        filter_container_grid_info.append(filter_container_grid_info_button_2);
                        
                        const filter_container_grid_input = $(document.createElement('input'));
                        filter_container_grid_input.addClass("sbui-input sbui-input--tiny");
                        filter_container_grid_input.attr({
                            "type": "text", 
                            "value": f.value
                        });

                        const filter_container_grid_value_child_child_child = $(document.createElement('div'));
                        filter_container_grid_value_child_child_child.addClass("sbui-input-container");
                        filter_container_grid_value_child_child_child.append(filter_container_grid_input);

                        const filter_container_grid_value_child_child = $(document.createElement('div'));
                        filter_container_grid_value_child_child.addClass("sbui-formlayout__content-container-horizontal");
                        filter_container_grid_value_child_child.append(filter_container_grid_value_child_child_child);

                        const filter_container_grid_value_child = $(document.createElement('div'));
                        filter_container_grid_value_child.addClass("sbui-formlayout");
                        filter_container_grid_value_child.addClass("sbui-formlayout--tiny");
                        filter_container_grid_value_child.addClass("sbui-formlayout--responsive");
                        filter_container_grid_value_child.append(filter_container_grid_value_child_child);

                        const filter_container_grid_value = $(document.createElement('div'));
                        filter_container_grid_value.append(filter_container_grid_value_child);
                        
                        const filter_container_grid = $(document.createElement('div'));
                        filter_container_grid.addClass("sb-grid-filter-row");
                        filter_container_grid.append(filter_container_grid_info);
                        filter_container_grid.append(filter_container_grid_value);

                        const filter_container = $(document.createElement('div'));
                        filter_container.addClass("sbui-dropdown-misc");
                        filter_container.addClass("dropdown-filter-parent");
                        filter_container.attr({ "id": f.id });
                        filter_container.append(filter_container_grid);
                        
                        top_part.append(filter_container);

                        filter_container_grid_input.change(function() {

                            const dt_id = $(this).parents(".dropdown-filter-parent").attr("id");
                            if(dt_id != undefined && dt_id != null){
                                const _filter = filters.find((f)=>{ return f.id == dt_id});
                                if(_filter != undefined && _filter != null){
                                    _filter.value = $(this).val().trim();
                                }
                            } 

                        });

                        filter_container_grid_info_button_0.unbind( "click" );
                        filter_container_grid_info_button_0.click(function(event) {
                            event.stopPropagation();

                            const parent = $(this).parents(".dropdown-filter-parent");
                            const position = parent.position();

                            const item = $(this).find(".item-info-join");

                            container_overlay.css({ "top": (position.top+40)+"px" , "left": "40px" });
                            
                            if(!parent.is(':first-child')){
                                JOINING_VALS.forEach((j)=>{
                                    if(item.text().trim() != j.symbol.trim())dropdown_control.append(create_menu_option(j.description, item, j.symbol, 0));
                                });
                            }
                        });

                        filter_container_grid_info_button_1.unbind( "click" );
                        filter_container_grid_info_button_1.click(function(event) {
                            event.stopPropagation();

                            const parent = $(this).parents(".dropdown-filter-parent");
                            const position = parent.position();
                            const offset = $(this).offset();

                            const item = $(this).find(".item-info-column");
                            
                            container_overlay.css({ "top": (position.top+40)+"px" , "left": (offset.left-410)+"px" });
                            
                            table_columns.forEach((col)=>{
                                if(item.text() != col)dropdown_control.append(create_menu_option(col, item, col, 1));
                            });
                            
                        });

                        filter_container_grid_info_button_2.unbind( "click" );
                        filter_container_grid_info_button_2.click(function(event) {
                            event.stopPropagation();

                            const parent = $(this).parents(".dropdown-filter-parent");
                            const position = parent.position();
                            const offset = $(this).offset();

                            const item = $(this).find(".item-info-operator");

                            container_overlay.css({ "top": (position.top+40)+"px" , "left": (offset.left-410)+"px" });
                            
                            FILTER_VALS.forEach((col)=>{
                                if(item.text().trim() != col.symbol.trim())dropdown_control.append(create_menu_option(`[${col.symbol}] ${col.description}`, item, col.symbol, 2));
                            });
                            
                        });

                        filter_container_grid_info_span_button.unbind( "click" );
                        filter_container_grid_info_span_button.click(function(event) {
                            event.stopPropagation();
                            const row = $(this).parents(".dropdown-filter-parent");
                            const parent = row.parent();
                            const dt_id = row.attr("id");
                            filter_container.remove();

                            if(dt_id != undefined && dt_id != null){
                                const index = filters.findIndex(item => item.id == dt_id);
                                filters.splice(index,1);

                                if(filters.length > 0){
                                    filters[0].join = "N/A";
                                }
                            }

                            const item = parent.children().first().find(".item-info-join");
                            if(item != undefined && item != null)item.html("N/A");
                        });
                    }
                    
                    const _tb = $(".sbui-menu__item.sbui-menu__item--active .truncate").text();
                    filters.filter((f)=>{ return f.table == _tb}).forEach((f)=>{
                        show_filter(f);
                    });
                    
                    popup.children().first().unbind( "click" );
                    popup.children().first().click(function(event) {
                        event.stopPropagation();

                        dropdown_control.html('');
                    });

                    bottom_part_span_button_filter.unbind( "click" );
                    bottom_part_span_button_filter.click(function(event) {
                        event.stopPropagation();

                        dropdown_control.html('');

                        const data_id = Math.random().toString(36).slice(2);
                        const tb = $(".sbui-menu__item.sbui-menu__item--active .truncate").text();

                        const f = {
                            id:data_id,
                            table:tb,
                            join:filters.filter((f)=>{ return f.table == _tb}).length == 0 ? "N/A" : JOINING_VALS[0].symbol,
                            column:table_columns[0],
                            operator:FILTER_VALS[0].symbol,
                            value:""
                        };
                        
                        filters.push(f);

                        show_filter(f);
                        
                    });

                    bottom_part_span_button_search.unbind( "click" );
                    bottom_part_span_button_search.click(function(event) {
                        const parameters = getFilters();
                        
                        const page_item = $('.sbui-menu__item.sbui-menu__item--active');
                        const project = page_item.attr("data-project");
                        const table = page_item.text();

                        const pages_limit = $('.pages-limit');
                        const page_number = $('.page-number');
                        const page_up = $('.page-up-btn');
                        const page_down = $('.page-down-btn');

                        const options = {
                            limit:parseInt(pages_limit.text().replace(" rows","")),
                            page:parseInt(page_number.val()),
                            query:parameters,
                            sort:{},
                            select: ''
                        };

                        load_grid_data( table, project, options, (data)=>{
                            table_columns = data.table_columns;

                            page_number.attr("max",data.pageSize);
                            page_number.attr("value",data.page);
                    
                            if(data.page != 1) page_down.removeAttr("disabled");
                            else page_down.prop("disabled",true);
                    
                            if(data.page != data.pageSize) page_up.removeAttr("disabled");
                            else page_up.prop('disabled', true);  
                    
                            $(".pages-total").html(`of ${data.pageSize}`); 
                            $(".pages-count").html(`${data.total} record${data.total == 1 ? '' : 's'}`); 
                            $(".sb-grid-body").html(data.render); 
                        });

                        removePopups('.popup_container');

                    });
                });
                
                window.onload = (event) => {
                    const item = $('.sbui-menu__item.sbui-menu__item--active');
                    setup_paging(item);

                    $(window).unbind( "click" );
                    $(window).click(function() {
                        removePopups('.popup_container');
                    });
                };
            }, script_options)
        ]
    };
    
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/options', options_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());

    
    
};

const auth_users = async (req, res, project) => {
    const selected_page = "Authentication";

    var _sections = [];
    var _content = [];
    const { sections, content } = project;

    if(sections != undefined && sections != null) _sections = sections;
    if(content != undefined && content != null) _content = content;

    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Authentication",
        views:_sections
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name(), "Authentication"],
        views:_content
    };
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/options', options_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const storage_buckets = async (req, res, project) => {
    const selected_page = "Storage";
    
    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Authentication",
        views:[]
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name(), "Storage"],
        views:[]
    };

    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/options', options_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const editor_sql = async (req, res, project) => {
    const selected_page = "SQL";
    
    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"SQL",
        views:[]
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name()],
        views:[]
    };
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/options', options_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const database_tables = async (req, res, project) => {
    const selected_page = "Database";

    var _sections = [];
    var _content = [];
    const { sections, content } = project;

    if(sections != undefined && sections != null) _sections = sections;
    if(content != undefined && content != null) _content = content;

    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Database",
        views:_sections
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name()],
        views:_content
    };
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/options', options_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const reports = async (req, res, project) => {
    const selected_page = "Reports";

    var _content = [];
    const { content } = project;

    if(content != undefined && content != null) _content = content;
    
    const sidebar_args = { project, selected_page };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name()],
        views:_content
    };
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const report = (project, title, sections, content) => {
    const selected_page = "Reports";

    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Filters",
        views:sections
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name(), title],
        views:content
    };
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/options', options_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    return view.render();
};

const api_default = async (req, res, project) => {
    const selected_page = "API";
    
    var _sections = [];
    var _content = [];
    const { sections, content } = project;

    if(sections != undefined && sections != null) _sections = sections;
    if(content != undefined && content != null) _content = content;

    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"API",
        views:_sections
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name()],
        views:_content
    };
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const settings_general = async (req, res, project) => {
    const selected_page = "Settings";

    var _sections = [];
    var _content = [];
    const { sections, content } = project;

    if(sections != undefined && sections != null) _sections = sections;
    if(content != undefined && content != null) _content = content;
    
    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Settings",
        views:_sections
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name(), "General Settings"],
        views:_content
    };
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/options', options_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const account_me = async (req, res, project) => {
    
    const selected_page = "Account";
    
    const sidebar_args = { selected_page };
    const main_args = {
        selected_page, 
        breadcrumbs:['Projects', "Account"],
        views:[]
    };

    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const new_project = async (req, res) => { 

    const main_args = {
        breadcrumbs:[
            view_engine.createElement( "a", { "href":"/" },[
                view_engine.createElement( "img", { 
                    "src":"/img/logos/supabase-logo.svg",
                    "alt":"Kagaconnect",
                    "class":"border dark:border-dark rounded p-1 hover:border-white",
                    "style":"height: 24px;",
                }), 
            ]),
            'Create a new project',
            'Extend your database'
        ],
        views:[
            div({ "class":"m-10 mx-auto max-w-2xl" },[
                view_engine.createElement( "section", { "class":"has-slide-in slide-in" },[
                    div({ "class":"sbui-loading" },[
                        div({ "class":"sbui-loading-content" },[
                            view_engine.createElement( "form", { 
                                "action":"/projects/new", 
                                "method":"post",
                                "class":"border border-panel-border-light dark:border-panel-border-dark rounded mb-8 undefined" 
                            },[
                                div({ "class":"bg-panel-body-light dark:bg-panel-body-dark" },[
                                    div({ "class":"px-6 py-4 flex items-center" },[
                                        div( null ,[
                                            view_engine.createElement( "h4", { "class":"sbui-typography-title mb-0" } ,"Create a new project"),
                                        ]),
                                    ]),
                                ]),
                                div({ "class":"bg-panel-body-light dark:bg-panel-body-dark" },[
                                    div({ "class":"px-6 py-4 pt-0 pb-6" },[
                                        span({ "class":"sbui-typography-text" },
                                            "Your project will have its own dedicated instance and full database.<br>An API will be set up so you can easily interact with your new database.<br>"
                                        ),
                                    ]),
                                    div({ "class":"px-6 py-4 Form section-block--body has-inputs-centered border-b border-t border-panel-border-interior-light dark:border-panel-border-interior-dark" },[
                                        div({ "class":"form-group" },[
                                            view_engine.createElement( "label", null,"Name"),
                                            view_engine.createElement( "input", { 
                                                "name":"name",
                                                "class":"form-control text-base",
                                                "type":"text", 
                                                "placeholder":"Project name", 
                                                "value":"", 
                                            }),
                                        ]),
                                    ]),
                                    div({ "class":"px-6 py-4 Form section-block--body has-inputs-centered border-b border-panel-border-interior-light dark:border-panel-border-interior-dark" },[
                                        div({ "class":"form-group" },[
                                            view_engine.createElement( "label", null,"Database Password"),
                                            view_engine.createElement( "input", { 
                                                "name":"db_pass",
                                                "class":"form-control text-base",
                                                "type":"password", 
                                                "placeholder":"Type in a strong password", 
                                                "value":"", 
                                            }),
                                            div({  "class":"form-text form-help" },[
                                                /*div( 
                                                { 
                                                    "class":"mb-2 bg-bg-alt-light dark:bg-bg-alt-dark rounded overflow-hidden transition-all border dark:border-dark",
                                                    "aria-valuemax":"100",
                                                    "aria-valuemin":"0",
                                                    "aria-valuenow":"100%",
                                                    "aria-valuetext":"100%",
                                                    "role":"progressbar",
                                                },[
                                                    div({ 
                                                        "style":"width: 100%;",
                                                        "class":"relative h-2 w-full bg-green-500 transition-all duration-500 ease-out shadow-inner" 
                                                    }),
                                                ]),
                                                span({  "class":"text-green-600" }, "This password is strong. "),*/
                                                span({  "class":"" }, "This is the password to your postgres database, so it must be a strong password and hard to guess."),
                                            ]),
                                        ]),
                                    ]),
                                    div({ "class":"px-6 py-4 Form section-block--body has-inputs-centered" },[
                                        div({ "class":"form-group" },[
                                            view_engine.createElement( "label", null,"Region"),
                                            view_engine.createElement( "select", {
                                                "name":"db_region",
                                                "class":"form-control",
                                                "style":"padding: 0.5rem 1rem"
                                            },[
                                                view_engine.createElement( "option", {  "value":"af-east-1"}, "East Africa (Tanzania)"),
                                            ]),
                                            div({  "class":"form-text form-help"}, "Select a region close to you for the best performance."),
                                        ]),
                                    ])
                                ]),
                                div({ "class":"bg-panel-footer-light dark:bg-panel-footer-dark border-t border-panel-border-interior-light dark:border-panel-border-interior-dark" },[
                                    div({ "class":"px-6 h-12 flex items-center" },[
                                        div({ "class":"flex items-center w-full justify-between" },[
                                            span({ "class":"sbui-btn-container" },[
                                                button({ "class":"sbui-btn sbui-btn-default sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" },[
                                                    span(null , "Cancel"),
                                                ]),
                                            ]),
                                            span({ "class":"space-x-3" },[
                                                span({ "class": "sbui-typography-text sbui-typography-text-secondary sbui-typography-text-small" } , "You can rename your project later"),
                                                span({ "class":"sbui-btn-container" },[
                                                    button({ 
                                                        "type":"submit",
                                                        "name":"submit",
                                                        "class":"sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" 
                                                    },[
                                                        span(null , "Create new project"),
                                                    ]),
                                                ])
                                            ]),
                                        ]),
                                    ]),
                                ]),
                            ]),
                        ]),
                    ]),
                ]),
            ]),
        ]
    };

    const view = page([
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const project_console= async (req, res, project) => { 
    const selected_page = "Console";
    
    var _content = [
        div({ 
            "class":"shell terminal w-full",
            "scrolltop":"0",
            "style":"--char-width:6.60938; overflow: auto;"
        }),
        view_engine.createElement("script", { "type":"text/javascript", "src":"/script/project_console.js"})
    ];
    const { content } = project;

    if(content != undefined && content != null && content.length > 0) _content = content;

    const sidebar_args = { project, selected_page };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.get_name(), selected_page],
        views:_content
    };
    
    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const page_not_found= async (app, req, res, next) => { 
    const selected_page = null;

    const sidebar_args = { project:_project, selected_page };
    const main_args = { 
        project:_project, 
        selected_page, 
        breadcrumbs:['Projects', (_project != undefined && _project != null ? _project.get_name() : ""), 'Not Found'],
        views:[]
    };

    const view = page([
        view_engine.loadElement('../components/sidebar', sidebar_args),
        view_engine.loadElement('../components/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const authenticate = async (req, res, next) => {

    if(req?.originalUrl == req?.headers["x-proxy-path"]){
        return next();
    }

    const cookie = req?.cookies?.Session;
    
    if(cookie != undefined && cookie != null){
        const decipher = crypto.createDecipheriv(process.env.CRYPTO_ALGORITHM, process.env.CRYPTO_KEY, Buffer.from(process.env.CRYPTO_IV, 'hex'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(cookie, 'hex')), decipher.final()]);
    
        const token = JSON.parse(decrpyted).access_token;
        
        if (!token) {
            return res.status(403).send("A token is required for authentication");
        }
        else{
            try {
                const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
                req.user = decoded;
            } catch (err) {
                return res.status(401).send("Invalid Token");
            }
        }

        return next();
    }
    else res.redirect('/');
};

const error_handler = async (app, req, res, next) => {
   
    if(req?.originalUrl == req?.headers["x-proxy-path"]){
        next();
    }
    else if (req.accepts('html')) {
        if(!_rendered)
            await project(req, res, _project);
        else{
            let found = false;
            
            const routes = getRoutes(app, req, res, next);            
            for(var i=0; i<routes.size; i++){
                const r = getSetValueByIndex(routes, i);
                const reg = new RegExp(`^${r}$`);
                found = reg.test(req.originalUrl);
                if(found) break;
            }

            if(!found) await page_not_found(app, req, res, next);
            else next();
        }
    }
    else next();
};

const create_element = (tagName, attributes, children) => {
    return view_engine.createElement(tagName, attributes, children);
};

const load_element = (element, args) => {
    return view_engine.loadElement(element, args);
};

const functionify = (func, reserved=[]) => {
    return view_engine.functionify(func, reserved);
};

const create_report_templates = (report_templates) => {
    const views = [];

    report_templates.forEach((template)=>{
        views.push(create_element( "li", { "class":"col-span-1 flex shadow-sm rounded-md" },[
          create_element( "a", { 
              "class":"w-full col-span-3 md:col-span-1 ",
              "href":template.link 
          },[
              create_element( "div", { "class":"bg-panel-header-light dark:bg-panel-header-dark  hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark  border border-border-secondary-light dark:border-border-secondary-dark  hover:border-border-secondary-hover-light dark:hover:border-border-secondary-hover-dark p-4 h-32 rounded  transition ease-in-out duration-150 flex flex-col","style":"display: grid;" },[
                create_element( "div", { "class":"rounded", "style":"grid-column-start: 1; height:100%; width:94px; overflow:hidden;"},[
                  create_element( "img", { "src":`${template.url}`, "style":"height:100%; width:94px;"},),
                ]),
                create_element( "div", {  "style":"grid-column-start: 2; padding-left:8px;"  },[
                    create_element( "h4", {  "class":"sbui-typography-title", "style":"margin-bottom:0px; font-size:16px;" }, `${template.name}`),
                    create_element( "div", null,[
                        create_element( "div", {  "class":"sbui-typography-text", "style":"opacity:0.8;" },`${template.description}`) 
                    ]) 
                ]) 
              ])
          ]) 
      ]));
    });

    return views;
};

const use = (server) => {
    const app = server.app;

    app.get("/", async (req, res) => { await login(req, res, null); });
    app.post("/", async (req, res) => { await login(req, res, null); });
    app.put("/", async (req, res) => { await login(req, res, null); });
    app.delete("/", async (req, res) => { await login(req, res, null); });
    app.patch("/", async (req, res) => { await login(req, res, null); });

    app.post('/rpc', rpc_server.middleware());

    app.post("/authentication", async (req, res) => { 
        const {connection, email, password} = req.body;

        if(connection != undefined && connection != null){
            if(connection == "custom"){
                if(email != undefined && email != null && email.trim().length > 0){
                    if(password != undefined && password != null && password.trim().length > 0){ 
                        
                        const { ACCESS_TOKEN_EMAIL, ACCESS_TOKEN_PASSWORD } = process.env;

                        if(email.trim().toLowerCase() == ACCESS_TOKEN_EMAIL && 
                            password == ACCESS_TOKEN_PASSWORD){
                            const payload ={ connection:connection, email:email, password:password };

                            const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
                                algorithm: "HS256",
                                expiresIn: parseInt(process.env.ACCESS_TOKEN_LIFE)
                            });

                            const refresh_token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
                                algorithm: "HS256",
                                expiresIn: parseInt(process.env.REFRESH_TOKEN_LIFE)
                            });

                            const token = {
                                access_token:access_token,
                                token_type:"bearer",
                                expires_in:parseInt(process.env.ACCESS_TOKEN_LIFE),
                                refresh_token:refresh_token
                            };

                            const cipher = crypto.createCipheriv(process.env.CRYPTO_ALGORITHM, process.env.CRYPTO_KEY, Buffer.from(process.env.CRYPTO_IV, 'hex'));
                            const encrypted = Buffer.concat([cipher.update(JSON.stringify(token)), cipher.final()]);

                            res.cookie(`Session`,encrypted,{
                                maxAge: parseInt(process.env.ACCESS_TOKEN_LIFE)*1000,
                                secure: true,
                                httpOnly: true,
                                sameSite: 'none'
                            });

                            res.redirect('/');
                        }
                        else await login(req, res, "Invalid credentials", req.body);                        
                    }
                    else await login(req, res, "Password is required", req.body);
                }
                else await login(req, res, "Email is required", req.body);
            }
            else await login(req, res, "Unsupported authentication provider", req.body);
        }
        else await login(req, res, "Provider is required", req.body);
    });

    app.post("/logout", authenticate, async (req, res) => { 
        res.clearCookie(`Session`);
        res.redirect('/');
    });

    app.get("/new/project", authenticate, new_project);
    
    app.post("/projects/new", authenticate, async (req, res) => {
        const {name, db_pass, db_region} = req.body;
        //console.log({name, db_pass, db_region});

        // const name = dir;
        // const projects_path = path.join(__dirname + `/../../api/projects/`);
        // const project_path = path.join(projects_path + `/${name}`);
        // const config = dotenv.parse(fs.readFileSync(path.join(project_path+'/.env')));
        
        // const location = config.PROJECT_LOCATION;
        // const url = `${req.protocol}://${req.hostname}:${req.protocol == 'https' ? config.HTTPS_PORT : config.HTTP_PORT}`;

        
        res.redirect('/');
    });

    app.get("/*", authenticate, async (req, res, next) => { await error_handler(app, req, res, next); });
    app.post("/*", authenticate, async (req, res, next) => { await error_handler(app, req, res, next); });
    app.put("/*", authenticate, async (req, res, next) => { await error_handler(app, req, res, next); });
    app.delete("/*", authenticate, async (req, res, next) => { await error_handler(app, req, res, next); });
    app.patch("/*", authenticate, async (req, res, next) => { await error_handler(app, req, res, next); });
};


const attach = (server) => {
    _app = server.app;
    _project = server.project; 
    _apidoc = server.apidoc; 

    _app.use(cookieParser());

    const trusted_environment = async (req, res) => {
        const cookie = req?.cookies?.Session;
        if(cookie != undefined && cookie != null)await project(req, res, _project); 
        else await login(req, res, null);
    }

    _app.get("/", async (req, res) => { await trusted_environment(req, res); });
    _app.post("/", async (req, res) => { await trusted_environment(req, res); });
    _app.put("/", async (req, res) => { await trusted_environment(req, res); });
    _app.delete("/", async (req, res) => { await trusted_environment(req, res); });
    _app.patch("/", async (req, res) => { await trusted_environment(req, res); });

    _app.post('/rpc', rpc_server.middleware());

    _app.post("/authentication", async (req, res) => { 
        const {connection, email, password} = req.body;

        if(connection != undefined && connection != null){
            if(connection == "custom"){
                if(email != undefined && email != null && email.trim().length > 0){
                    if(password != undefined && password != null && password.trim().length > 0){ 
                        
                        const { 
                            ACCESS_TOKEN_EMAIL, 
                            ACCESS_TOKEN_PASSWORD, 
                            ACCESS_TOKEN_LIFE, 
                            REFRESH_TOKEN_LIFE, 
                            CRYPTO_ALGORITHM,
                            CRYPTO_KEY,
                            CRYPTO_IV
                        } = process.env;

                        if(email.trim().toLowerCase() == ACCESS_TOKEN_EMAIL && 
                            password == ACCESS_TOKEN_PASSWORD){
                            const payload ={ connection:connection, email:email, password:password };

                            const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
                                algorithm: "HS256",
                                expiresIn: parseInt(ACCESS_TOKEN_LIFE)
                            });

                            const refresh_token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
                                algorithm: "HS256",
                                expiresIn: parseInt(REFRESH_TOKEN_LIFE)
                            });

                            const token = {
                                access_token:access_token,
                                token_type:"bearer",
                                expires_in:parseInt(ACCESS_TOKEN_LIFE),
                                refresh_token:refresh_token
                            };

                            const cipher = crypto.createCipheriv(CRYPTO_ALGORITHM, CRYPTO_KEY, Buffer.from(CRYPTO_IV, 'hex'));
                            const encrypted = Buffer.concat([cipher.update(JSON.stringify(token)), cipher.final()]);

                            res.cookie(`Session`,encrypted,{
                                maxAge: parseInt(ACCESS_TOKEN_LIFE)*1000,
                                secure: true,
                                httpOnly: true,
                                sameSite: 'none'
                            });

                            res.redirect('/');
                        }
                        else await login(req, res, "Invalid credentials", req.body);                        
                    }
                    else await login(req, res, "Password is required", req.body);
                }
                else await login(req, res, "Email is required", req.body);
            }
            else await login(req, res, "Unsupported authentication provider", req.body);
        }
        else await login(req, res, "Provider is required", req.body);
    });

    _app.post("/logout", authenticate, async (req, res) => { 
        res.clearCookie(`Session`);
        res.redirect('/');
    });

    _app.get("/project/console", authenticate, async (req, res) => { 

        _project.content = [];

        await project_console(req, res, _project);
    });

    _app.post("/project/editor/table", authenticate, async (req, res) => {   
 
        const {name, options} = req.body;

        try{            
            const data = await fetch_grid_data(name, options, _project);
           
            res.status(200).json(data);
        }
        catch(e){
            console.log(e.message);

            res.status(501).send(e.message);
        }
    });

    _app.get("/project/editor/table", authenticate, async (req, res) => { 
        await editor_table(req, res, _project);
    });

    _app.get("/project/auth/:action", authenticate, async (req, res) => {   
        const action = req.params.action;
        const base_url = "/project/auth";

        const sections = [
            {
                title:"General", 
                links:[
                    { selected:`users` == `${action}`, target:"_self", url:`${base_url}/users`, title:"Users" },
                    { selected:`templates` == `${action}`, target:"_self", url:`${base_url}/templates`, title:"Templates" }
                ]
            },
            {
                title:"Config", 
                links:[
                    { selected:`settings` == `${action}`, target:"_self", url:`${base_url}/settings`, title:"Settings" }
                ]
            }
        ];
        
        _project.content = [];

        if("users" == action){
            const tables = [];

            tables.push(view_engine.createElement( "tr", null, [
                view_engine.createElement( "td", { 
                    "class":"h-28 p-4 whitespace-nowrap border-t leading-5 text-gray-300 text-sm",
                    "colspan":"6" 
                })
            ]));

            tables.push(view_engine.createElement( "tr", null, [
                view_engine.createElement( "td", { "colspan":"6" },[
                    view_engine.createElement( "nav", { 
                        "class":"flex items-center justify-between overflow-hidden",
                        "aria-label":"Pagination"
                    },[
                        div({ "class":"hidden sm:block" },[
                            view_engine.createElement( "p", { "class":"text-xs text-gray-400" },
                                "Showing<span class='px-1 font-medium text-gray-400'>0</span>to<span class='px-1 font-medium text-gray-400'>0</span>of<span class='px-1 font-medium text-gray-400'>0</span>results"
                            ),
                        ]),
                        div({ "class":"flex-1 flex justify-between sm:justify-end" })
                    ])
                ])
            ]));

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"p-4" }, [
                        div( null , [
                            div({ "class":"flex justify-between items-center" }, [
                                div({ "class":"flex items-center"  }, [
                                    div( null,[]),
                                    div( null,[
                                        div( null,[
                                            div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive" },[
                                                div({ "class":"sbui-formlayout__content-container-horizontal" },[
                                                    div({ "class":"sbui-input-container" },[
                                                        view_engine.createElement( "input", { 
                                                            "placeholder":"Search by email",
                                                            "type":"text",
                                                            "class":"sbui-input sbui-input--with-icon sbui-input--tiny",
                                                        }),
                                                        div({ "class":"sbui-input-icon-container" },[
                                                            svg.create([ 
                                                                svg.circle(11, 11, 8),
                                                                svg.line(21, 21, 16.65, 16.65)
                                                            ])
                                                        ]),
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                    ]),
                                ]),
                                div( null , [
                                    span({ "class":"sbui-btn-container" },[
                                        button({ "class":"sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" },[
                                            svg.create([ 
                                                svg.line(12, 5, 12, 19),
                                                svg.line(5, 12, 19, 12)
                                            ]),
                                            span(null, "New"),
                                        ])
                                    ])
                                ]),
                            ]),
                        ]),
                        div({ "class":"w-full my-4" }, [
                            div({ "class":"table-container" }, [
                                view_engine.createElement( "table", { "class":"table" }, [
                                    view_engine.createElement( "thead", null, [
                                        view_engine.createElement( "tr", null, [
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Email"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Phone"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left hidden lg:table-cell" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Provider"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left hidden lg:table-cell" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Created"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left hidden lg:table-cell" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Last Sign In"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" }),
                                            ]),
                                        ]),
                                    ]),
                                    view_engine.createElement( "tbody", null, tables)
                                ])
                            ])
                        ])
                    ])
                ])
            ];
        }
        else if("templates" == action){
            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"content w-full h-full overflow-y-auto" }, [
                        div({ "class":"mx-auto w-full" }, [
                            view_engine.createElement( "article", {  "class":"p-4" },[

                                form.create([
                                    form.header("SMS Message"),
                                    form.input("Body"   , "Your code is {{ .Code }}", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                                ]),

                                form.create([
                                    form.header("Confirm Signup"),
                                    form.input("Subject"   , "Confirm Your Signup", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px;" }),
                                    form.textarea("Body"   , "\n\n<h2>Confirm your signup</h2>\n\n<p>Follow this link to confirm your user:</p>\n<p><a href='{{ .ConfirmationURL }}'>Confirm your mail</a></p>\n", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px; padding-top:0px;" }),
                                ]),

                                form.create([
                                    form.header("Reset password"),
                                    form.input("Subject"   , "Reset Your Password", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px;" }),
                                    form.textarea("Body"   , "\n\n<h2>Reset Password</h2>\n\n<p>Follow this link to reset the password for your user:</p>\n<p><a href='{{ .ConfirmationURL }}'>Reset Password</a></p>\n", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px; padding-top:0px;" }),
                                ]),

                                form.create([
                                    form.header("Magic Link"),
                                    form.input("Subject"   , "Your Magic Link", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px;" }),
                                    form.textarea("Body"   , "\n\n<h2>Magic Link</h2>\n\n<p>Follow this link to login:</p>\n<p><a href='{{ .ConfirmationURL }}'>Log In</a></p>\n", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px; padding-top:0px;" }),
                                ]),

                                form.create([
                                    form.header("Invite user"),
                                    form.input("Subject"   , "You have been invited", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px;" }),
                                    form.textarea("Body"   , "\n\n<h2>You have been invited</h2>\n\n<p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>\n<p><a href='{{ .ConfirmationURL }}'>Accept the invite</a></p>\n", "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px; padding-top:0px;" }),
                                ]),

                            ])
                        ])
                    ])
                ])
            ];
        }
        else if("settings" == action){
            const base_url_no_port = req.get('host').includes(":") ? req.get('host').substring(0, req.get('host').indexOf(":")) : req.get('host');
            let base_port = "";
            if(req.protocol == "https") base_port = `:${_project.get_ports().HTTPS_PORT}`;
            if(req.protocol == "http") base_port = `:${_project.get_ports().HTTP_PORT}`;

            const base_auth_settings = _project.get_auth_settings();

            const forms = [];

            forms.push(
                form.create([
                    form.header("General"),
                    form.input("Site URL" , `${req.protocol}://${base_url_no_port}${base_port}`, "The base URL of your website. Used as an allow-list for redirects and for constructing URLs used in emails.", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                    form.input("JWT Expiry" , _project.get_jwt_expiry(), "How long tokens are valid for, in seconds. Defaults to 3600 (1 hour), maximum 604,800 seconds (one week).", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                    form.switcher("Disable Signup" , base_auth_settings.DisableSignup, "Allow/disallow new user signups to your project.", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                ])
            );

            if(base_auth_settings.EmailAuth.Enabled){
                forms.push(
                    form.create([
                        form.header("Email Auth"),
                        form.switcher("Enable Email Signup" , base_auth_settings.EmailAuth.EnableEmailSignup, "Allow/disallow new user signups via email to your project.", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                        form.switcher("Enable email confirmations" , base_auth_settings.EmailAuth.EnableEmailconfirmations, "If enabled, users need to confirm their email address before signing in.", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                        form.switcher("Enable Custom SMTP" , base_auth_settings.EmailAuth.EnableCustomSMTP, "", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                    ])
                );
            }
            
            if(base_auth_settings.PhoneAuth.Enabled){
                forms.push(
                    form.create([
                        form.header("Phone Auth"),
                        form.switcher("Enable Phone Signup" , base_auth_settings.PhoneAuth.EnablePhoneSignup, "Allow/disallow new user signups via phone to your project.", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                        form.switcher("Enable phone confirmations" , base_auth_settings.PhoneAuth.EnablePhoneConfirmations, "If enabled, users need to confirm their phone number before signing in.", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                    ])
                );
            }
            

            if(base_auth_settings.ExternalOAuthProviders.Enabled){
                forms.push(
                    form.create([
                        form.header("External OAuth Providers"),
                        form.switcher("Apple enabled" , base_auth_settings.ExternalOAuthProviders.AppleEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("Azure enabled" , base_auth_settings.ExternalOAuthProviders.AzureEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("Bitbucket enabled" , base_auth_settings.ExternalOAuthProviders.BitbucketEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("Discord enabled" , base_auth_settings.ExternalOAuthProviders.DiscordEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("Facebook enabled" , base_auth_settings.ExternalOAuthProviders.FacebookEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("GitHub enabled" , base_auth_settings.ExternalOAuthProviders.GitHubEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("GitLab enabled" , base_auth_settings.ExternalOAuthProviders.GitLabEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("Google enabled" , base_auth_settings.ExternalOAuthProviders.GoogleEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("Twitch enabled" , base_auth_settings.ExternalOAuthProviders.TwitchEnabled, "", { "class":"Form section-block--body px-6 sbui-divider--light sbui-divider--no-text", "style":"padding-bottom:0px;" }),
                        form.switcher("Twitter enabled" , base_auth_settings.ExternalOAuthProviders.TwitterEnabled, "", { "class":"Form section-block--body px-6", "style":"padding-bottom:0px;" }),
                    ])
                );
            }
            


            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"content w-full h-full overflow-y-auto" }, [
                        div({ "class":"mx-auto w-full" }, [
                            view_engine.createElement( "article", {  "class":"p-4" },forms)
                        ])
                    ])
                ])
            ];
        }

        _project.sections = [ 
            div({ 
                "role":"menu",
                "aria-orientation":"vertical" ,
                "aria-labelledby":"options-menu" 
            }, create_options_section(sections))
        ];

        await auth_users(req, res, _project);
    });

    _app.get("/project/storage/buckets", authenticate, async (req, res) => {     
        await storage_buckets(req, res, _project);
    });

    _app.get("/project/editor/sql", authenticate, async (req, res) => {     
        await editor_sql(req, res, _project);
    });

    _app.get("/project/extension/:action/:id", authenticate, async (req, res) => { 
        const action = req.params.action;
        const id = req.params.id;

        const extensions = await _project.get_extensions();
        const extension = extensions.find(element => element.get_id() == id);
        if(extension != undefined && extension != null){
            extension.set_activated(action == "true");
            res.status(200).json(toJson("Successful", `Extension: ${action == "true" ? "activated" : "deactivated"}`));
        }
        else{
            res.status(400).json(toJson("Error", "Cant find extension"));
        }
    });

    _app.get("/project/database/:action/:id", authenticate, async (req, res) => { 
        const id = req.params.id;
        const action = req.params.action;
        const base_url = "/project/database";

        const sections = [
            {
                title:"Database", 
                links:[
                    { selected:`tables` == `${action}`, target:"_self", url:`${base_url}/tables`, title:"Tables" },
                    { selected:`roles` == `${action}`, target:"_self", url:`${base_url}/roles`, title:"Roles" },
                    { selected:`extensions` == `${action}`, target:"_self", url:`${base_url}/extensions`, title:"Extensions" },
                    { selected:`replication` == `${action}`, target:"_self", url:`${base_url}/replication`, title:"Replication" },
                    { selected:`triggers` == `${action}`, target:"_self", url:`${base_url}/triggers`, title:"Triggers" },
                    { selected:`functions` == `${action}`, target:"_self", url:`${base_url}/functions`, title:"Functions" },
                ]
            },
            {
                title:"Settings", 
                links:[
                    { selected:`backups` == `${action}`, target:"_self", url:`${base_url}/backups`, title:"Backups" },
                    { selected:`pooling` == `${action}`, target:"_self", url:`${base_url}/pooling`, title:"Connection Pooling" }
                ]
            }
        ];

        _project.content = [];
        
        if("roles" == action){
            const tables = [];
            const permissions =  await _project.get_permissions();           
            const role = await _project.get_role(id);
            
            for (var c=0; c<permissions.length; c++) {
                const permission = permissions[c];

                let has_permission = false;
 
                if(role != undefined && role != null){
                    if(role.permissions != undefined && role.permissions != null){
                        const _permission = role.permissions.filter(function(p) { return p.name == permission.name; }).shift();
                        has_permission = _permission != undefined && _permission != null;
                    }
                }

                if(c > 0){
                    tables.push(
                        div({ 
                            "class":"sbui-divider sbui-divider--light sbui-divider--no-text",
                            "role":"seperator" 
                        })
                    );   
                }

                tables.push(
                    div({ "class":"px-6 py-4 w-full flex justify-between items-center" }, [
                        span({ "class":"sbui-typography-text" }, `${permission.name}`),
                        view_engine.createElement( "code", { "class":"sbui-typography-text sbui-typography-text-small" }, `${has_permission}`),
                    ])
                );                    
            }

            

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col"},[
                    div({ "class":"p-4"},[
                        div({ "class":"w-full flex-1 pl-0" }, [
                            div({ "class":"mb-8" }, [
                                div( null , [
                                    view_engine.createElement( "nav", { "class":"flex -mb-px" } , [
                                        div({ "class":"group inline-flex items-center p-1 mr-4 " } , [
                                            span({ "class":"sbui-btn-container" } , [
                                                view_engine.createElement( "a", { 
                                                    "href":`/project/database/${action}`
                                                } , [
                                                    button({ 
                                                        "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center"
                                                    } , [
                                                        svg.create([ svg.polyline("15 18 9 12 15 6") ])
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                        view_engine.createElement( "a", { 
                                            "href":`#`,
                                            "aria-current":"page",
                                            "class":" text-typography-body-strong-light dark:text-typography-body-strong-dark group inline-flex items-center p-1 font-medium text-sm focus:outline-none " 
                                        } , [ span(null , "Permissions") ])
                                    ])
                                ])
                            ]),
                            div({ "class":"sbui-loading" }, [
                                div({ "class":"sbui-loading-content" }, [
                                    div({ "class":"border border-panel-border-light dark:border-panel-border-dark rounded mb-8 undefined" }, [
                                        div({ "class":"bg-panel-body-light dark:bg-panel-body-dark" }, tables),
                                    ]),
                                ]),
                            ]),
                        ])
                    ])
                ]),
                script(()=>{ 
                    $('.tr--link').unbind( "click" );
                    $('.tr--link').click(function() {
                        window.location = $(this).data("href");
                    });
                })
            ];
        }
        else if("replication" == action){
            const tables = [];

            const collections = await _project.get_tables();

            collections.sort(function(a, b) {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });

            for (var c=0; c<collections.length; c++) {
                let name = collections[c];
    
                tables.push(table.tr([
                    table.td([ span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  `${name}`) ], { "class":"p-3 px-4 text-left" }),
                    table.td([ span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "public") ], { "class":"p-3 px-4 text-left" }),
                    table.td([ span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "") ], { "class":"p-3 px-4 text-left text-left hidden lg:table-cell" }),
                    table.td([
                        span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, [
                            div({ "class":"flex flex-row space-x-3 items-center justify-end" }, [
                                div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right m-0 p-0 ml-2 mt-1 -mb-1" }, [
                                    div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                        button({ 
                                            "type":"button",
                                            "aria-pressed":"false",
                                            "class":"sbui-toggle sbui-toggle--tiny",
                                        }, [
                                            span({ 
                                                "aria-hidden":"true",
                                                "class":"sbui-toggle__handle"
                                            }),
                                        ]),
                                    ]),
                                ]),
                            ]),
                        ])
                    ], { "class":"p-3 px-4 text-left text-center" }),
                ]));                
            }

            

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col"},[
                    div({ "class":"p-4"},[
                        div({ "class":"w-full flex-1 pl-0" }, [
                            div({ "class":"mb-8" }, [
                                div( null , [
                                    view_engine.createElement( "nav", { "class":"flex -mb-px" } , [
                                        div({ "class":"group inline-flex items-center mr-4 " } , [
                                            span({ "class":"sbui-btn-container" } , [
                                                view_engine.createElement( "a", { 
                                                    "href":`/project/database/${action}`
                                                } , [
                                                    button({ 
                                                        "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center"
                                                    } , [
                                                        svg.create([ svg.polyline("15 18 9 12 15 6") ])
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                        div( null , [ 
                                            div( null , [ 
                                                div({  "class":" sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive" } , [ 
                                                    div({  "class":"sbui-formlayout__content-container-horizontal" } , [ 
                                                        div({  "class":"sbui-input-container" } , [ 
                                                            view_engine.createElement( "input", {  
                                                                "placeholder":"Filter",
                                                                "type":"text",
                                                                "class":"sbui-input sbui-input--with-icon sbui-input--tiny"
                                                            }),
                                                            div({  "class":"sbui-input-icon-container" } , [ 
                                                                svg.create([ 
                                                                    svg.circle(11, 11, 8),
                                                                    svg.line(21, 21, 16.65, 16.65) 
                                                                ])
                                                            ])
                                                        ])
                                                    ])
                                                ])
                                            ])
                                        ])
                                    ])
                                ])
                            ]),
                            div({ "class":"table-container" }, [
                                table.create([
                                    table.thead([
                                        table.tr([
                                            table.th([ span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Name") ], { "class":"p-3 px-4 text-left" }),
                                            table.th([ span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Schema") ], { "class":"p-3 px-4 text-left" }),
                                            table.th([ span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Description") ], { "class":"p-3 px-4 text-left text-left hidden lg:table-cell" }),
                                            table.th([
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, [
                                                    div({ "class":"flex flex-row space-x-3 items-center justify-end" }, [
                                                        div({ "class":"text-xs leading-4 font-medium text-gray-400 text-right " }, "All Tables"),
                                                        div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right m-0 p-0 ml-2 mt-1 -mb-1" }, [
                                                            div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                                                button({ 
                                                                    "type":"button",
                                                                    "aria-pressed":"false",
                                                                    "class":"sbui-toggle sbui-toggle--tiny",
                                                                }, [
                                                                    span({ 
                                                                        "aria-hidden":"true",
                                                                        "class":"sbui-toggle__handle",
                                                                    }, [
    
                                                                    ]),
                                                                ]),
                                                            ]),
                                                        ]),
                                                    ]),
                                                ])
                                            ], { "class":"p-3 px-4 text-left text-center" }),
                                        ]),
                                    ]),
                                    table.tbody(tables)
                                ])

                                /*view_engine.createElement( "table", { "class":"table" }, [
                                    view_engine.createElement( "thead", null, [
                                        view_engine.createElement( "tr", null, [
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Name"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Schema"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left text-left hidden lg:table-cell" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Description"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left text-center" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, [
                                                    div({ "class":"flex flex-row space-x-3 items-center justify-end" }, [
                                                        div({ "class":"text-xs leading-4 font-medium text-gray-400 text-right " }, "All Tables"),
                                                        div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right m-0 p-0 ml-2 mt-1 -mb-1" }, [
                                                            div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                                                button({ 
                                                                    "type":"button",
                                                                    "aria-pressed":"false",
                                                                    "class":"sbui-toggle sbui-toggle--tiny",
                                                                }, [
                                                                    span({ 
                                                                        "aria-hidden":"true",
                                                                        "class":"sbui-toggle__handle",
                                                                    }, [
    
                                                                    ]),
                                                                ]),
                                                            ]),
                                                        ]),
                                                    ]),
                                                ]),
                                            ])
                                        ]),
                                    ]),
                                    view_engine.createElement( "tbody", null, tables)
                                ]),*/
                            ]),
                        ])
                    ])
                ]),
                script(()=>{ 
                    $('.replication-button').unbind( "click" );
                    $('.replication-button').click(function() {
                        window.location = $(this).data("href");
                    });
                })
            ];
        }
        
        _project.sections = [ 
            div({ 
                "role":"menu",
                "aria-orientation":"vertical" ,
                "aria-labelledby":"options-menu" 
            }, create_options_section(sections))
        ];

        await database_tables(req, res, _project);
    });

    _app.post("/project/database/:action", authenticate, async (req, res) => { 
        const action = req.params.action;

        try{
            if("tables" == action){
                const tables = [];
                const format = num =>  String(num).replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1,');
    
                const collections = await _project.get_tables();
    
                collections.sort(function(a, b) {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                });
    
                for (var c=0; c<collections.length; c++) {
                    let name = collections[c];
        
                    const stats = await _project.get_stats(name);
                    const count = stats.count != '?' ? format(stats.count) : stats.count;
                    const size = stats.size != '?' ? bytesToSize(stats.size) : stats.size;

                    tables.push({name, count, size});
                }

                res.status(200).json(tables);
            }
            else res.status(501).send("unknown action");            
        }
        catch(e){
            console.log(e.message);

            res.status(501).send(e.message);
        }
    });

    _app.get("/project/database/:action", authenticate, async (req, res) => { 
        const action = req.params.action;
        const base_url = "/project/database";

        const sections = [
            {
                title:"Database", 
                links:[
                    { selected:`tables` == `${action}`, target:"_self", url:`${base_url}/tables`, title:"Tables" },
                    { selected:`roles` == `${action}`, target:"_self", url:`${base_url}/roles`, title:"Roles" },
                    { selected:`extensions` == `${action}`, target:"_self", url:`${base_url}/extensions`, title:"Extensions" },
                    { selected:`replication` == `${action}`, target:"_self", url:`${base_url}/replication`, title:"Replication" },
                    { selected:`triggers` == `${action}`, target:"_self", url:`${base_url}/triggers`, title:"Triggers" },
                    { selected:`functions` == `${action}`, target:"_self", url:`${base_url}/functions`, title:"Functions" },
                ]
            },
            {
                title:"Settings", 
                links:[
                    { selected:`backups` == `${action}`, target:"_self", url:`${base_url}/backups`, title:"Backups" }
                ]
            }
        ];

        _project.content = [];

        if("tables" == action){

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"p-4" }, [
                        div( null , [
                            div({ "class":"flex justify-between items-center" }, [
                                div({ "class":"flex items-center"  }, [
                                    div( null,[]),
                                    div( null,[
                                        div( null,[
                                            div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive" },[
                                                div({ "class":"sbui-formlayout__content-container-horizontal" },[
                                                    div({ "class":"sbui-input-container" },[
                                                        view_engine.createElement( "input", { 
                                                            "placeholder":"Filter",
                                                            "type":"text",
                                                            "class":"sbui-input sbui-input--with-icon sbui-input--tiny",
                                                        }),
                                                        div({ "class":"sbui-input-icon-container" },[
                                                            svg.create([ 
                                                                svg.circle(11, 11, 8),
                                                                svg.line(21, 21, 16.65, 16.65)
                                                            ])
                                                        ]),
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                    ]),
                                ]),
                                div( null , [
                                    span({ "class":"sbui-btn-container" },[
                                        button({ "class":"sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" },[
                                            svg.create([ 
                                                svg.line(12, 5, 12, 19),
                                                svg.line(5, 12, 19, 12)
                                            ]),
                                            span(null, "New"),
                                        ])
                                    ])
                                ]),
                            ]),
                        ]),
                        div({ "class":"w-full my-4" }, [
                            div({ "class":"table-container" }, [
                                view_engine.createElement( "table", { "class":"table" }, [
                                    view_engine.createElement( "thead", null, [
                                        view_engine.createElement( "tr", null, [
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Name"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Schema"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left hidden lg:table-cell" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Description"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left hidden lg:table-cell" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Rows (Estimated)"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left hidden lg:table-cell" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Size (Estimated)"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" }),
                                            ]),
                                        ]),
                                    ]),
                                    view_engine.createElement( "tbody", null, [])
                                ])
                            ])
                        ])
                    ])
                ]),
                script(()=>{ 
                    window.onload = (event) => {
                        var url = `/project/database/tables`;                
                        var timeout = 1000*60*5;
                                
                        fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        }, timeout)
                        .then((response) => {
                            if (response.ok) return response.json();
                            else {
                                throw new Error(response.text());
                            }
                        })
                        .then(data =>{
                            data.forEach((row)=>{
                                const td_1_span = $(document.createElement('span'));
                                td_1_span.addClass('sbui-typography-text');
                                td_1_span.html(row.name);
                                const td_1 = $(document.createElement('td'));
                                td_1.append(td_1_span);

                                const td_2_span = $(document.createElement('span'));
                                td_2_span.addClass('sbui-typography-text');
                                td_2_span.html("public");
                                const td_2 = $(document.createElement('td'));
                                td_2.append(td_2_span);

                                const td_3_span = $(document.createElement('span'));
                                td_3_span.addClass('sbui-typography-text');
                                td_3_span.html("");
                                const td_3 = $(document.createElement('td'));
                                td_3.addClass('truncate');
                                td_3.addClass('max-w-sm');
                                td_3.addClass('hidden');
                                td_3.addClass('lg:table-cell');
                                td_3.append(td_3_span);

                                const td_4_code = $(document.createElement('code'));
                                td_4_code.addClass('sbui-typography-text');
                                td_4_code.addClass('sbui-typography-text-small');
                                td_4_code.html(row.count);
                                const td_4 = $(document.createElement('td'));
                                td_4.addClass('hidden');
                                td_4.addClass('xl:table-cell');
                                td_4.append(td_4_code);

                                const td_5_code = $(document.createElement('code'));
                                td_5_code.addClass('sbui-typography-text');
                                td_5_code.addClass('sbui-typography-text-small');
                                td_5_code.html(row.size);
                                const td_5 = $(document.createElement('td'));
                                td_5.addClass('hidden');
                                td_5.addClass('xl:table-cell');
                                td_5.append(td_5_code);


                                const td_6_div_span_1_button_span = $(document.createElement('span'));
                                td_6_div_span_1_button_span.html('columns');
                                const td_6_div_span_1_button = $(document.createElement('button'));
                                td_6_div_span_1_button.addClass('sbui-btn');
                                td_6_div_span_1_button.addClass('sbui-btn-default');
                                td_6_div_span_1_button.addClass('sbui-btn-container--shadow');
                                td_6_div_span_1_button.addClass('sbui-btn--tiny');
                                td_6_div_span_1_button.addClass('hover:border-gray-500');
                                td_6_div_span_1_button.addClass('whitespace-nowrap');
                                td_6_div_span_1_button.addClass('sbui-btn--text-align-center');
                                td_6_div_span_1_button.css({"padding":"5px"});
                                td_6_div_span_1_button.append(td_6_div_span_1_button_span);
                                td_6_div_span_1_button.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path></svg>');
                                const td_6_div_span_1 = $(document.createElement('span'));
                                td_6_div_span_1.addClass('sbui-btn-container');
                                td_6_div_span_1.append(td_6_div_span_1_button);

                                const td_6_div_span_2_button = $(document.createElement('button'));
                                td_6_div_span_2_button.addClass('sbui-btn');
                                td_6_div_span_2_button.addClass('sbui-btn-default');
                                td_6_div_span_2_button.addClass('sbui-btn-container--shadow');
                                td_6_div_span_2_button.addClass('sbui-btn--tiny');
                                td_6_div_span_2_button.addClass('hover:border-gray-500');
                                td_6_div_span_2_button.addClass('whitespace-nowrap');
                                td_6_div_span_2_button.addClass('sbui-btn--text-align-center');
                                td_6_div_span_2_button.css({"padding":"5px"});
                                td_6_div_span_2_button.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><path d="M12 20h9"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>');
                                const td_6_div_span_2 = $(document.createElement('span'));
                                td_6_div_span_2.addClass('sbui-btn-container');
                                td_6_div_span_2.append(td_6_div_span_2_button);

                                const td_6_div_span_3_button = $(document.createElement('button'));
                                td_6_div_span_3_button.addClass('sbui-btn');
                                td_6_div_span_3_button.addClass('sbui-btn-default');
                                td_6_div_span_3_button.addClass('sbui-btn-container--shadow');
                                td_6_div_span_3_button.addClass('sbui-btn--tiny');
                                td_6_div_span_3_button.addClass('hover:border-gray-500');
                                td_6_div_span_3_button.addClass('whitespace-nowrap');
                                td_6_div_span_3_button.addClass('sbui-btn--text-align-center');
                                td_6_div_span_3_button.css({"padding":"5px"});
                                td_6_div_span_3_button.append('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>');
                                const td_6_div_span_3 = $(document.createElement('span'));
                                td_6_div_span_3.addClass('sbui-btn-container');
                                td_6_div_span_3.append(td_6_div_span_3_button);

                                const td_6_div = $(document.createElement('div'));
                                td_6_div.addClass('flex');
                                td_6_div.addClass('gap-2');
                                td_6_div.addClass('justify-end');
                                td_6_div.append(td_6_div_span_1);
                                td_6_div.append(td_6_div_span_2);
                                td_6_div.append(td_6_div_span_3);
                                const td_6 = $(document.createElement('td'));
                                td_6.append(td_6_div);
                        
                                const tr = $(document.createElement('tr'));
                                tr.append(td_1);
                                tr.append(td_2);
                                tr.append(td_3);
                                tr.append(td_4);
                                tr.append(td_5);
                                tr.append(td_6);

                                $('tbody').append(tr);
                                

                            });
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                    };
                })
            ];
        }
        else if("roles" == action){
            const tables = [];
            const roles = await _project.get_roles();

            for (var c=0; c<roles.length; c++) {
                const role = roles[c];

                let users = role.users;
                if(Array.isArray(role.users))users = role.users.length;

                tables.push(
                    view_engine.createElement( "tr", { "class":"tr--link", "data-href":`/project/database/${action}/${role._id}` }, [
                        view_engine.createElement( "td",  { "style":"width: 25%;" }, [
                            span({ "class":"sbui-typography-text" }, role.name)
                        ]),
                        view_engine.createElement( "td", { "style":"width: 25%;" }, [
                            span({ "class":"sbui-typography-text" }, `${role._id}`)
                        ]),
                        view_engine.createElement( "td", { "class":"w-full" }, [
                            div({ "class":"flex items-center space-x-3" }, [
                                span({ "class":"sbui-typography-text" }, `${users} User${(users == 1 ? "" : "s")}`)
                            ]),
                        ]),
                        view_engine.createElement( "td", { "class":"w-min", "style":"max-width: 64px;" }, [
                            span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, [
                                svg.create([ 
                                    svg.polyline("9 18 15 12 9 6")
                                ])
                            ])
                        ])
                    ])
                );                    
            }

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"p-4" }, [
                        div( null , [
                            div({ "class":"flex justify-between items-center" }, [
                                div({ "class":"flex items-center"  }, [
                                    div( null,[]),
                                    div( null,[
                                        div( null,[
                                            div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive" },[
                                                div({ "class":"sbui-formlayout__content-container-horizontal" },[
                                                    div({ "class":"sbui-input-container" },[
                                                        view_engine.createElement( "input", { 
                                                            "placeholder":"Filter roles",
                                                            "type":"text",
                                                            "class":"sbui-input sbui-input--with-icon sbui-input--tiny",
                                                        }),
                                                        div({ "class":"sbui-input-icon-container" },[
                                                            svg.create([ 
                                                                svg.circle(11, 11, 8),
                                                                svg.line(21, 21, 16.65, 16.65)
                                                            ])
                                                        ]),
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                    ]),
                                ])
                            ]),
                        ]),
                        div({ "class":"w-full my-4" }, [
                            div({ "class":"table-container" }, [
                                view_engine.createElement( "table", { "class":"table" }, [
                                    view_engine.createElement( "thead", null, [
                                        view_engine.createElement( "tr", null, [
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Name"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "System ID"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Connections"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  ""),
                                            ])
                                        ]),
                                    ]),
                                    view_engine.createElement( "tbody", null, tables)
                                ])
                            ])
                        ])
                    ])
                ]),
                script(()=>{ 
                    $('.tr--link').unbind( "click" );
                    $('.tr--link').click(function() {
                        window.location = $(this).data("href");
                    });
                })
            ];
        }
        else if("replication" == action)
        {
            const tables = [];

            tables.push(
                view_engine.createElement( "tr", { "class":"border-t " }, [
                    view_engine.createElement( "td", { "class":"px-4 py-3", "style":"width: 25%;" }, [
                        span({ "class":"sbui-typography-text" }, "realtime")
                    ]),
                    view_engine.createElement( "td", { "class":"hidden lg:table-cell", "style":"width: 25%;" }, [
                        span({ "class":"sbui-typography-text" }, "16402")
                    ]),
                    view_engine.createElement( "td", null, [
                        div({ "class":"flex justify-center" }, [
                            div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right" }, [
                                div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                    button({ 
                                        "type":"button",
                                        "aria-pressed":"false",
                                        "class":"sbui-toggle sbui-toggle--tiny sbui-toggle--active" 
                                    }, [
                                        span({ 
                                            "aria-hidden":"true",
                                            "class":"sbui-toggle__handle sbui-toggle__handle--active" 
                                        }, [
                                    
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ]),
                    view_engine.createElement( "td", null, [
                        div({ "class":"flex justify-center" }, [
                            div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right" }, [
                                div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                    button({ 
                                        "type":"button",
                                        "aria-pressed":"false",
                                        "class":"sbui-toggle sbui-toggle--tiny sbui-toggle--active" 
                                    }, [
                                        span({ 
                                            "aria-hidden":"true",
                                            "class":"sbui-toggle__handle sbui-toggle__handle--active" 
                                        }, [
                                    
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ]),
                    view_engine.createElement( "td", null, [
                        div({ "class":"flex justify-center" }, [
                            div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right" }, [
                                div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                    button({ 
                                        "type":"button",
                                        "aria-pressed":"false",
                                        "class":"sbui-toggle sbui-toggle--tiny sbui-toggle--active" 
                                    }, [
                                        span({ 
                                            "aria-hidden":"true",
                                            "class":"sbui-toggle__handle sbui-toggle__handle--active" 
                                        }, [
                                    
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ]),
                    view_engine.createElement( "td", null, [
                        div({ "class":"flex justify-center" }, [
                            div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right" }, [
                                div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                    button({ 
                                        "type":"button",
                                        "aria-pressed":"false",
                                        "class":"sbui-toggle sbui-toggle--tiny sbui-toggle--active" 
                                    }, [
                                        span({ 
                                            "aria-hidden":"true",
                                            "class":"sbui-toggle__handle sbui-toggle__handle--active" 
                                        }, [
                                    
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ]),
                    view_engine.createElement( "td", { "class":"px-4 py-3 pr-2" }, [
                        div({ "class":"flex gap-2 justify-end" }, [
                            div({ "class":"sbui-btn-container" }, [
                                button({ 
                                    "class":"replication-button sbui-btn sbui-btn-default sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center",                                    
                                    "style":"padding-top: 3px; padding-bottom: 3px;",
                                    "data-href":`/project/database/${action}/defaults`
                                }, [
                                    span(null , "0 tables")
                                ])
                            ])
                        ])
                    ])
                ])
            );  

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"p-4" }, [
                        div( null , [
                            div({ "class":"flex justify-between items-center" }, [
                                div({ "class":"flex items-center"  }, [
                                    div( null,[]),
                                    div( null,[
                                        div( null,[
                                            div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive" },[
                                                div({ "class":"sbui-formlayout__content-container-horizontal" },[
                                                    div({ "class":"sbui-input-container" },[
                                                        view_engine.createElement( "input", { 
                                                            "placeholder":"Filter",
                                                            "type":"text",
                                                            "class":"sbui-input sbui-input--with-icon sbui-input--tiny",
                                                        }),
                                                        div({ "class":"sbui-input-icon-container" },[
                                                            svg.create([ 
                                                                svg.circle(11, 11, 8),
                                                                svg.line(21, 21, 16.65, 16.65)
                                                            ])
                                                        ]),
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                    ]),
                                ]),
                            ]),
                        ]),
                        div({ "class":"w-full my-4" }, [
                            div({ "class":"table-container" }, [
                                view_engine.createElement( "table", { "class":"table" }, [
                                    view_engine.createElement( "thead", null, [
                                        view_engine.createElement( "tr", null, [
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Name"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left hidden lg:table-cell" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "System ID"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left text-center" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Insert"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left text-center" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Update"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left text-center" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Delete"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left text-center" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Truncate"),
                                            ]),
                                            view_engine.createElement( "th", { "class":"p-3 px-4 text-left text-right" }, [
                                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" },  "Source"),
                                            ]),
                                        ]),
                                    ]),
                                    view_engine.createElement( "tbody", null, tables)
                                ])
                            ])
                        ])
                    ])
                ]),
                view_engine.createElement("script", { "type":"text/javascript", "src":"/script/database_replication.js"})
            ];
        }
        else if("extensions" == action){

            let extension_sets = [];
            const enabled_sets = [];
            const disabled_sets = [];

            const extensions = await _project.get_extensions();
            extensions.forEach((extension)=>{
                if(extension.hasOwnProperty('get_activated')){
                    if(extension.get_activated()){
                        if(extension.hasOwnProperty('get_id') && extension.hasOwnProperty('get_name') && extension.hasOwnProperty('get_description')){
                            enabled_sets.push(div({ 
                                "data-extension":extension.get_id(),
                                "class":"extension-set border border-border-secondary-light dark:border-border-secondary-dark rounded flex flex-col" 
                            }, [
                                div({ "class":" p-4 px-6 flex  bg-panel-header-light dark:bg-panel-header-dark border-b border-border-secondary-light dark:border-border-secondary-dark" }, [
                                    div({ "class":"m-0 h-5 uppercase flex-1" }, [
                                        view_engine.createElement( "h6", { "class":"sbui-typography-title" }, extension.get_name()),
                                    ]),
                                    div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right" }, [
                                        div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                            button({ 
                                                "type":"button",
                                                "aria-pressed":"false",
                                                "onclick":"toggle_event(this)",
                                                "class":"sbui-toggle sbui-toggle--tiny sbui-toggle--active",
                                            }, [
                                                span({ 
                                                    "aria-hidden":"true",
                                                    "class":"sbui-toggle__handle sbui-toggle__handle--active",
                                                })
                                            ])
                                        ])
                                    ])
                                ]),
                                div({ "class":" bg-panel-header-light dark:bg-panel-header-dark bg-panel-secondary-light dark:bg-panel-secondary-dark  flex flex-col h-full" }, [
                                    div({ "class":"p-4 px-6" }, [
                                        span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, [
                                            span({ "class":"flex-grow capitalize-first" }, extension.get_description()),
                                        ]),
                                    ]),
                                    div({ "class":"p-4 px-6" }, [
                                        span({ "class":"sbui-typography-text sbui-typography-text-secondary sbui-typography-text-small" }, [
                                            span({ "class":"flex-grow capitalize-first" }, [
                                                span({ "class":"flex-grow capitalize-first" }, 
                                                    `Schema: <span class="sbui-badge">${extension.hasOwnProperty('get_schema') ? extension.get_schema() : "unknown"}</span>`
                                                ),
                                            ]),
                                        ]),
                                    ]),
                                ]),
                            ]));
                        }
                    }
                    else{
                        if(extension.hasOwnProperty('get_id') && extension.hasOwnProperty('get_name') && extension.hasOwnProperty('get_description')){
                            disabled_sets.push(div({ 
                                "data-extension":extension.get_id(),
                                "class":"extension-set border border-border-secondary-light dark:border-border-secondary-dark rounded flex flex-col" 
                            }, [
                                div({ "class":" p-4 px-6 flex  bg-panel-header-light dark:bg-panel-header-dark border-b border-border-secondary-light dark:border-border-secondary-dark" }, [
                                    div({ "class":"m-0 h-5 uppercase flex-1" }, [
                                        view_engine.createElement( "h6", { "class":"sbui-typography-title" }, extension.get_name()),
                                    ]),
                                    div({ "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--flex sbui-formlayout--flex-right" }, [
                                        div({ "class":"sbui-formlayout__content-container-horizontal" }, [
                                            button({ 
                                                "type":"button",
                                                "aria-pressed":"false",
                                                "onclick":"toggle_event(this)",
                                                "class":"sbui-toggle sbui-toggle--tiny",
                                            }, [
                                                span({ 
                                                    "aria-hidden":"true",
                                                    "class":"sbui-toggle__handle",
                                                })
                                            ])
                                        ])
                                    ])
                                ]),
                                div({ "class":" bg-panel-header-light dark:bg-panel-header-dark bg-panel-secondary-light dark:bg-panel-secondary-dark  flex flex-col h-full" }, [
                                    div({ "class":"p-4 px-6" }, [
                                        span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, [
                                            span({ "class":"flex-grow capitalize-first" }, extension.get_description()),
                                        ]),
                                    ]),
                                    div({ "class":"p-4 px-6" }, [
                                        span({ "class":"sbui-typography-text sbui-typography-text-secondary sbui-typography-text-small" }, [
                                            span({ "class":"flex-grow capitalize-first" }, [
                                                span({ "class":"flex-grow capitalize-first" }, 
                                                    `Schema: <span class="sbui-badge">${extension.hasOwnProperty('get_schema') ? extension.get_schema() : "unknown"}</span>`
                                                ),
                                            ]),
                                        ]),
                                    ]),
                                ]),
                            ]));
                        }
                    }
                }
            });

            if(enabled_sets.length > 0 || disabled_sets.length > 0){
                extension_sets = [
                    div( null, [
                        view_engine.createElement( "h4", { "class":"sbui-typography-title" }, "Enabled"),
                        div({ "class":"enabled-sets grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-4" }, enabled_sets)
                    ]),
    
                    div( null, [
                        view_engine.createElement( "h4", { "class":"sbui-typography-title" }, "Extensions"),
                        div({ "class":"disabled-sets grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-4" }, disabled_sets)
                    ])
                ];
            }
            else{
                extension_sets = [
                    div({ "class":"w-full h-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                        div({ "class":"flex h-full w-full items-center justify-center" }, [
                            div({ "class":"flex items-center justify-center w-full h-full" }, [
                                div({ "class":"flex space-x-4 p-6 border rounded dark:border-dark bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-md" }, [
                                    div({ "class":"flex flex-col" }, [
                                        div({ "class":"w-80 space-y-4" }, [
                                            div({ "class":"flex flex-col space-y-2" },[
                                                div({ "class":"block w-full bg-yellow-500 bg-opacity-5 p-3 border border-yellow-500 border-opacity-50 rounded" },[
                                                    div({ "class":"flex space-x-3" },[
                                                        div( null,[
                                                            svg.create([ 
                                                                svg.circle(12, 12, 10),
                                                                svg.line(12, 8, 12, 12),
                                                                svg.line(12, 16, 12.01, 16)
                                                            ],{"width":"20",  "height":"20", "class":"sbui-icon text-yellow-500"})
                                                        ]),
                                                        div({ "class":"flex flex-col" },[
                                                            span({ "class":"sbui-typography-text sbui-typography-text-warning" },"Extensions"),
                                                            div( null,[
                                                                div({ 
                                                                    "class":"sbui-typography-text sbui-typography-text-warning sbui-typography-text-small"
                                                                },"No extensions found"),
                                                            ]),
                                                        ]),
                                                    ]),
                                                ]),
                                                span({ 
                                                    "class":"sbui-typography-text sbui-typography-text-secondary" ,
                                                    "style":"margin-top:16px;" 
                                                },"Api extensions provide additional features that are not part of the core features")
                                            ])
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ])
                ];
            }

            

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"p-4" }, [
                        div({ "class":"extension-sets w-full my-4" }, extension_sets)
                    ])
                ]),
                script(()=>{ 
                    function toggle_event(item){
                        const parent = $(item).parents(".extension-set");
                        const container = $(item).parents(".extension-sets");
                        const enabled_sets = container.find(".enabled-sets");
                        const disabled_sets = container.find(".disabled-sets");

                        const toggled = $(item).hasClass("sbui-toggle--active");
                        if(toggled){
                            $(item).removeClass("sbui-toggle--active");
                            $(item).find(".sbui-toggle__handle").removeClass("sbui-toggle__handle--active");
                            
                            parent.remove();
                            disabled_sets.append(parent);
                        }
                        else{
                            $(item).addClass("sbui-toggle--active");
                            $(item).find(".sbui-toggle__handle").addClass("sbui-toggle__handle--active");

                            enabled_sets.append(parent);
                        }
                        
                        fetch(`/project/extension/${!toggled}/${parent.data( "extension" )}`)
                        .then((response) => {
                            if (response.ok) return response.json();
                            else throw new Error(response.text());
                        })
                        .then(data =>{
                            
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                    } 
                })
            ];
        }
        else if("triggers" == action){

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"flex h-full w-full items-center justify-center" }, [
                        div({ "class":"flex items-center justify-center w-full h-full" }, [
                            div({ "class":"flex space-x-4 p-6 border rounded dark:border-dark bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-md" }, [
                                div({ "class":"flex flex-col" }, [
                                    div({ "class":"w-80 space-y-4" }, [
                                        view_engine.createElement( "h6", { "class":"sbui-typography-title" },"Triggers"),
                                        div({ "class":"flex flex-col space-y-2" },[
                                            div({ "class":"block w-full bg-yellow-500 bg-opacity-5 p-3 border border-yellow-500 border-opacity-50 rounded" },[
                                                div({ "class":"flex space-x-3" },[
                                                    div( null,[
                                                        svg.create([ 
                                                            svg.circle(12, 12, 10),
                                                            svg.line(12, 8, 12, 12),
                                                            svg.line(12, 16, 12.01, 16)
                                                        ])
                                                    ]),
                                                    div({ "class":"flex flex-col" },[
                                                        span({ "class":"sbui-typography-text sbui-typography-text-warning" },"Alpha preview"),
                                                        div( null,[
                                                            div({ "class":"sbui-typography-text sbui-typography-text-warning sbui-typography-text-small" },"This is not implemented yet"),
                                                        ]),
                                                    ]),
                                                ]),
                                            ]),
                                            span({ "class":"sbui-typography-text sbui-typography-text-secondary" },"A trigger is a function invoked automatically whenever an event associated with a table occurs."),
                                            span({ "class":"sbui-typography-text sbui-typography-text-secondary" },"An event could be any of the following: INSERT, UPDATE, DELETE. A trigger is a special user-defined function associated with a table.")
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
            ];
        }
        else if("functions" == action){

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"flex h-full w-full items-center justify-center" }, [
                        div({ "class":"flex items-center justify-center w-full h-full" }, [
                            div({ "class":"flex space-x-4 p-6 border rounded dark:border-dark bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-md" }, [
                                div({ "class":"flex flex-col" }, [
                                    div({ "class":"w-80 space-y-4" }, [
                                        view_engine.createElement( "h6", { "class":"sbui-typography-title" },"Functions"),
                                        div({ "class":"flex flex-col space-y-2" },[
                                            div({ "class":"block w-full bg-yellow-500 bg-opacity-5 p-3 border border-yellow-500 border-opacity-50 rounded" },[
                                                div({ "class":"flex space-x-3" },[
                                                    div( null,[
                                                        svg.create([ 
                                                            svg.circle(12, 12, 10),
                                                            svg.line(12, 8, 12, 12),
                                                            svg.line(12, 16, 12.01, 16)
                                                        ],{"width":"20",  "height":"20", "class":"sbui-icon text-yellow-500"})
                                                    ]),
                                                    div({ "class":"flex flex-col" },[
                                                        span({ "class":"sbui-typography-text sbui-typography-text-warning" },"Alpha preview"),
                                                        div( null,[
                                                            div({ "class":"sbui-typography-text sbui-typography-text-warning sbui-typography-text-small" },"This is not implemented yet"),
                                                        ]),
                                                    ]),
                                                ]),
                                            ]),
                                            span({ "class":"sbui-typography-text sbui-typography-text-secondary" },"Functions, also known as stored procedures, is a set of SQL and procedural commands such as declarations, assignments, loops, flow-of-control, etc.")
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
            ];
        }
        else if("backups" == action){

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"flex" }, [
                        div({ "class":"p-4 w-full my-2 max-w-4xl mx-auto space-y-8" }, [
                            view_engine.createElement( "h3", { "class":"sbui-typography-title mb-0" }, "Backups"),
                            div({ 
                                "class":"sbui-divider sbui-divider--light sbui-divider--no-text",
                                "role":"seperator" 
                            }),
                            div( null, [
                                span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, 
                                    "Projects are backed up daily and can be restored at any time."
                                ),
                            ]),
                            div({ "class":"space-y-6" }, [
                               //To do later
                            ]),
                        ])
                    ])
                ])
            ];
        }

        _project.sections = [ 
            div({ 
                "role":"menu",
                "aria-orientation":"vertical" ,
                "aria-labelledby":"options-menu" 
            }, create_options_section(sections))
        ];

        await database_tables(req, res, _project);
    });

    _app.get("/project/reports", authenticate, async (req, res) => {  
        
        _project.content = [
            div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                div({ "class":"max-w-7xl mx-auto w-full my-16 space-y-16" }, [
                    div({ "class":"flex items-center justify-center w-full h-full" }, [
                        div({ "class":"flex space-x-4 p-6 border rounded dark:border-dark bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-md" }, [
                            div({ "class":"flex flex-col" }, [
                                div({ "class":"w-80 space-y-4" }, [
                                    view_engine.createElement( "h6", { "class":"sbui-typography-title" }, "Reports"),
                                    div({ "class":"flex flex-col space-y-2" }, [
                                        span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, 
                                            "Create custom reports for your projects."
                                        ),
                                        span({ "class":"sbui-typography-text sbui-typography-text-secondary" }, 
                                            "Get a high level overview of your network traffic, user actions, and infrastructure health."
                                        )
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
            ])
        ];

        const content = await _project.get_report();
        if(content.length > 0)_project.content = content;

        await reports(req, res, _project);
    });

    _app.get("/project/api/default", authenticate, async (req, res) => {  

        const base_url = "/project/api/default";
    
        const parsedUrl = url.parse(req.url);
        let query = parsedUrl.query;
        if(query == undefined || query == null) query = "";
    
        const _views = [];

        const no_api_found = () =>{
            _views.push(
                div({ "class":"w-full h-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"flex h-full w-full items-center justify-center" }, [
                        div({ "class":"flex items-center justify-center w-full h-full" }, [
                            div({ "class":"flex space-x-4 p-6 border rounded dark:border-dark bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-md" }, [
                                div({ "class":"flex flex-col" }, [
                                    div({ "class":"w-80 space-y-4" }, [
                                        div({ "class":"flex flex-col space-y-2" },[
                                            div({ "class":"block w-full bg-yellow-500 bg-opacity-5 p-3 border border-yellow-500 border-opacity-50 rounded" },[
                                                div({ "class":"flex space-x-3" },[
                                                    div( null,[
                                                        svg.create([ 
                                                            svg.circle(12, 12, 10),
                                                            svg.line(12, 8, 12, 12),
                                                            svg.line(12, 16, 12.01, 16)
                                                        ],{"width":"20",  "height":"20", "class":"sbui-icon text-yellow-500"})
                                                    ]),
                                                    div({ "class":"flex flex-col" },[
                                                        span({ "class":"sbui-typography-text sbui-typography-text-warning" },"Documentation"),
                                                        div( null,[
                                                            div({ 
                                                                "class":"sbui-typography-text sbui-typography-text-warning sbui-typography-text-small"
                                                            },"No api documentation generated"),
                                                        ]),
                                                    ]),
                                                ]),
                                            ]),
                                            span({ 
                                                "class":"sbui-typography-text sbui-typography-text-secondary" ,
                                                "style":"margin-top:16px;" 
                                            },"Api documentation is autogenerated using swagger-jsdoc")
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
            );
        };

        if(_apidoc.hasOwnProperty('paths')){
            const entities = Object.entries(_apidoc.paths);
            if(entities.length > 0){
                const __views = [];
                for (const [key, value] of entities) {
                    for (const [_key, _value] of Object.entries(value)) {

                        const parameters = [];
                        if(_value.hasOwnProperty('description')){
                            parameters.push(
                                div({ "style":"padding-bottom:8px;" }, [
                                    view_engine.createElement( "p", null, _value.description)
                                ])
                            );                               
                        }
                        
                        if(_value.hasOwnProperty('parameters')){
                            const _parameters = [];

                            _parameters.push(
                                div({ 
                                    "style":"background: #343434; color: rgb(86, 156, 214); border-top: 1px solid rgb(31 31 31); color:white; padding: 8px 8px 4px 8px; font-size: 14px;"
                                }, "Name")
                            );
                            _parameters.push(
                                div({ 
                                    "style":"background: #343434; border-top: 1px solid rgb(31 31 31); color:white; padding: 8px 4px 4px 8px; font-size: 14px;" 
                                }, "Description")
                            );
                            
  
                            _value.parameters.forEach(parameter=>{
                                _parameters.push(
                                    div({ 
                                        "style":"color: rgb(86, 156, 214); border-top: 1px solid rgb(31 31 31); padding: 4px 8px 4px 8px; font-size: 14px;"
                                    }, parameter.hasOwnProperty('name') ? parameter.name.toLowerCase() : "")
                                );
                                _parameters.push(
                                    div({ 
                                        "style":"border-top: 1px solid rgb(31 31 31); padding: 4px 4px 4px 8px; font-size: 14px;" 
                                    }, parameter.hasOwnProperty('description') ? parameter.description.toLowerCase() : "")
                                );
                            });

                            parameters.push(
                                div({ "style":"margin-bottom:16px;  background:#2a2a2a; border-radius:4px; padding:8px 0px 8px 0px;" }, [
                                    span({ 
                                        "style":"display:block; color:#24b47e; font-size:14px; margin-top:0px; padding:0px 4px 4px 8px; "
                                    }, "Parameters"),
                                    div({ "style":"display: grid; grid-template-columns: auto 1fr; grid-template-columns: auto minmax(0, 1fr);" }, _parameters)
                                ])
                            );
                        }

                        if(_value.hasOwnProperty('summary')){
                            __views.push(
                                view_engine.createElement( "h3", { "class":"doc-heading", "style":"font-size:12px; padding:1rem 1rem 0px 1rem; " }, _value.hasOwnProperty('tags') && _value.tags.length > 0 ? _value.tags[0] : ""),
                                div({ "class":"doc-section" }, [
                                    view_engine.createElement( "article", { "class":"text" }, parameters),
                                    view_engine.createElement( "article", { "class":"code" }, [
                                        view_engine.createElement( "h4", { "style":"color:#24b47e; padding-left:8px;" }, _value.summary),
                                        div({ "class":"Code codeBlockWrapper" }, [
                                            view_engine.createElement( "pre", { "class":"codeBlock language-bash", "style":"background:#181818; border-radius:4px;" }, [
                                                span({ 
                                                    "class":"token-line",
                                                    "style":"color: rgb(191, 199, 213);" 
                                                }, [
                                                    span({ 
                                                        "class":"keyword module",
                                                        "style":"color:rgb(86, 156, 214);" 
                                                    }, _key.toUpperCase() ),
                                                    span({ "class":"token plain" }, " " ),
                                                    span({ "class":"token plain" }, key )
                                                ])
                                            ])
                                        ])
                                    ])
                                ])
                            );
                        }
                    }
                }

                _views.push(
                    div({ "class":"Docs h-full w-full overflow-y-auto" }, [
                        div({ "class":"Docs--inner-wrapper" }, [
                            div( null, __views)
                        ])
                    ])
                );
            }
            else no_api_found();
        }
        else no_api_found();
        

        const contents = [
            {
                query:"", 
                views:_views
            },
        ];
    
        const content = contents.filter(function(sec) { return sec.query == query; }).shift();
        if(content != undefined && content != null) _project.content = content.views;
        else _project.content = [];
        
        await api_default(req, res, _project);
    });

    _app.get("/project/settings/:action", authenticate, async (req, res) => {     
        const action = req.params.action;
        const base_url = "/project/settings";

        const sections = [
            {
                title:"Project", 
                links:[
                    { selected:`general` == `${action}`, target:"_self", url:`${base_url}/general`, title:"General" },
                    { selected:`database` == `${action}`, target:"_self", url:`${base_url}/database`, title:"Database" },
                    { selected:`api` == `${action}`, target:"_self", url:`${base_url}/api`, title:"API" },
                    { selected:`auth` == `${action}`, target:"_self", url:`/project/auth/settings`, title:"Auth settings" }
                ]
            }
        ];

        _project.content = [];

        if("general" == action){
            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"content w-full h-full overflow-y-auto" }, [
                        div({ "class":"mx-auto w-full" }, [
                            view_engine.createElement( "article", {  "class":"p-4" },[

                                form.create([
                                    form.header("General"),
                                    form.input("Name"   , _project.get_name(), "", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                                    form.input("Region" , _project.get_location(), "", { "class":"px-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark", "style":"padding-bottom:1rem;" }),
                                    form.section([
                                        div({  "class":"w-full flex items-center justify-between" }, [
                                            div( null, [
                                                span({ "class":"sbui-typography-text block" }, "Restart Server"),
                                                div({  "style":"max-width: 320px;" }, [
                                                    span({  "class":"sbui-typography-text opacity-50 sbui-typography-text-secondary" }, 
                                                        "Restart your project server"
                                                    ),
                                                ]),
                                            ]),
                                            span({  "class":"sbui-btn-container" }, [
                                                view_engine.createElement( "form", {  
                                                    "method":"post",
                                                    "action":`/api/${_project.get_id()}/restart`,
                                                }, [
                                                    button({   
                                                        "type":"submit",
                                                        "class":"sbui-btn sbui-btn-default sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" 
                                                    }, [
                                                        svg.create([ 
                                                            svg.polyline("1 4 1 10 7 10"),
                                                            svg.polyline("23 20 23 14 17 14"),
                                                            svg.path("M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15")
                                                        ]),
                                                        span(null, 
                                                            "Restart server"
                                                        ),
                                                    ]),
                                                ]),
                                            ]),
                                        ])
                                    ], { "class":"px-6 py-4 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark" })
                                ])
                            ])
                        ])
                    ])
                ])
            ];
        }
        else if("database" == action){

            const { port, name, host, username, password } = await _project.get_connection();

            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"content w-full h-full overflow-y-auto" }, [
                        div({ "class":"mx-auto w-full" }, [
                            view_engine.createElement( "article", {  "class":"p-4" },[

                                form.create([
                                    form.header("Connection info"),
                                    form.input_with_copy("Host"         , `${host}`, "", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                                    form.input_with_copy("Database name", `${name}`, "", { "class":"px-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark", "style":"padding-bottom:1rem;" }),
                                    form.input_with_copy("Port"         , `${port}`, "", { "class":"px-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark", "style":"padding-bottom:1rem;" }),
                                    form.input_with_copy("User"         , `${username}`, "", { "class":"px-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark", "style":"padding-bottom:1rem;" }),
                                    form.input_with_copy("Password"     , `${password}`, "", { "class":"px-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark", "style":"padding-bottom:1rem;" })                                  
                                ])
                                
                            ])
                        ])
                    ])
                ])
            ];
        }
        else if("api" == action){
            _project.content = [
                div({ "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col" }, [
                    div({ "class":"content w-full h-full overflow-y-auto" }, [
                        div({ "class":"mx-auto w-full" }, [
                            view_engine.createElement( "article", {  "class":"p-4" },[

                                form.create([
                                    form.header("Project API keys", "Your API is secured behind an API gateway which requires an API Key for every request.<br>You can use the keys below to use Supabase client libraries."),
                                    form.input_with_copy([
                                        view_engine.createElement( "code", { "class":"text-xs bg-gray-500 text-white px-2" }, "anon"),
                                        view_engine.createElement( "code", { "class":"text-xs bg-gray-500 text-white px-2 ml-1" }, "public")
                                    ] , "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNzY1MTg0NywiZXhwIjoxOTQzMjI3ODQ3fQ.iSos_PCc20HRpuCsAeU9lz5lx16-EWhFz-SCdLtInI4", "This key is safe to use in a browser if you have enabled Row Level Security for your tables and configured policies.", { "class":"Form section-block--body px-6", "style":"padding-bottom:1rem;" }),
                                    form.input_with_copy([
                                        view_engine.createElement( "code", { "class":"text-xs bg-gray-500 text-white px-2" }, "service_role"),
                                        view_engine.createElement( "code", { "class":"text-xs bg-red-500 px-2 ml-1 text-white" }, "secret")
                                    ], "**** **** **** ****", "This key has the ability to bypass Row Level Security. Never share it publicly.", { "class":"px-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark", "style":"padding-bottom:1rem;" }, "Reveal")      
                                ])
                            ])
                        ])
                    ])
                ]),
                script(()=>{ 
                    $('.tab-button').unbind( "click" );
                    $('.tab-button').click(function() {
                        const parent = $(this).parents(".sbui-tab-bar-inner-container");

                        parent.find('.sbui-btn-container button').each(function() {
                            $(this).removeClass('sbui-tab-button-underline--active');
                            $(this).attr("tabindex","-1");
                        });

                        
                        $(this).addClass('sbui-tab-button-underline--active');
                        $(this).attr("tabindex","0");

                        $(this).parents(".tabs-container").find('[role="tabpanel"]').each(function() {
                            $(this).prop("hidden",true);
                            $(this).attr("tabindex","-1");
                        });

                        const id = $(this).attr("aria-controls");
                        $(`#${id}`).attr("tabindex","0");
                        $(`#${id}`).removeAttr("hidden");

                    }); 
                })
            ];
        }

       

        _project.sections = [ 
            div({ 
                "role":"menu",
                "aria-orientation":"vertical" ,
                "aria-labelledby":"options-menu" 
            }, create_options_section(sections))
        ];

        await settings_general(req, res, _project);
    });

    _app.get("/account/me", authenticate, async (req, res) => {     
        await account_me(req, res, _project);
    });

    _app.get("/project", authenticate, async (req, res) => {     
        await project(req, res, _project);
    });

    _app.get("/*", authenticate, async (req, res, next) => { await error_handler(_app, req, res, next); });
    _app.post("/*", authenticate, async (req, res, next) => { await error_handler(_app, req, res, next); });
    _app.put("/*", authenticate, async (req, res, next) => { await error_handler(_app, req, res, next); });
    _app.delete("/*", authenticate, async (req, res, next) => { await error_handler(_app, req, res, next); });
    _app.patch("/*", authenticate, async (req, res, next) => { await error_handler(_app, req, res, next); });

};


module.exports = { create_report_templates, functionify, get_project, attach, use, create_options_section, fetch_grid_data, page, render, project, editor_table, auth_users, storage_buckets, editor_sql, database_tables, reports, api_default, settings_general, account_me, new_project,project_console, authenticate, create_element, load_element, report };