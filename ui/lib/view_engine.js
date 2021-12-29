const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UglifyJS = require("uglify-js");
const { v4: uuidv4 } = require('uuid');

const config = process.env;
const projects = [];

const fetchToken = (req) => {
  const authHeader = String(req.headers['authorization'] || '');
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7, authHeader.length);
  }
  else {
    return req.body.token || req.query.token || req.headers["x-access-token"];
  }
};

const functionify = (func, options={}) =>{
    var entire = func.toString(); 
    var body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
    return UglifyJS.minify(body, options).code;

    // return UglifyJS.minify(body, {
    //     // mangle: {
    //     //     reserved:reserved,
    //     //     properties: true,
    //     //     toplevel: true,
    //     // }
    // }).code;
};

const createElement = (tagName, attributes, children) => {
    
    let parent;
    
    if (typeof tagName == "string") {
        parent = { 
            tag: tagName,
            attributes:[],
            children:[],
            events:[],
            render:function(){
                let view = `<${this.tag}`;
                    if(this.attributes != undefined && this.attributes != null){
                        for (let attr of this.attributes) {
                            view += ` ${attr.key}="${attr.value}"`;
                        }
                    }
                    view += `>`;
                    if(this.children != undefined && this.children != null){
                        let chldrenType = typeof this.children;

                        if (chldrenType == "string") {
                            view += this.children;
                        }
                        else if(chldrenType == "object" && this.children instanceof Array){
                            for (let child of this.children) {
                                view += child.render(child);
                            }
                        }
                    }
                    view += `</${this.tag}>`;

                return view;
            }
        };
    } else if (typeof tagName == "object") {
        parent = tagName;
    }

    // I'm tired of using null as the attributes, e.g.: elem("div", null, ["some", "elements"])
    // Wouldn't it be nice if I could just do: elem("div", ["some", "elements"])
    // attributes expects a plain object; we can use that to differentiate
    if (typeof attributes != "undefined" && ["undefined", "boolean"].includes(typeof children)) {
        let attrType = typeof attributes;
        if (["string", "number"].includes(attrType)
            || (attrType == "object" && attributes instanceof Array)
            ) {
            children = attributes;
            attributes = null;
        }
    }

    if (attributes) {            
        for (let attribute in attributes) {            
            if (attribute.startsWith("on")) {                
                let callback = attributes[attribute];
                
                if (typeof callback == "string") {
                    parent.attributes.push({key:attribute, value:callback});
                }
                else if (typeof callback == "function") {
                    
                    let eventMatch = attribute.match(/^on([a-zA-Z]+)/);
                    if (eventMatch) {
                        let event = eventMatch[1];
                        parent.events.push({key:event, value:callback});

                        //// TODO: make sure it's a valid event?
                        //parent.addEventListener(event, callback);
                        //parent.eventListeners = parent.eventListeners || {};
                        //parent.eventListeners[event] = parent.eventListeners[event] || [];
                        //parent.eventListeners[event].push(callback);
                    }                    
                }                
            } else {
                parent.attributes.push({key:attribute, value:attributes[attribute]});
            }            
        }        
    }
    
     //console.log(attributes);
    // console.log(children);
   
    if (typeof children != "undefined" || children === 0) {
        parent.children = children;
    }
    
    return parent;
};

const loadElement = (element, args) => {
    const view = require(element);
    return view.createElement(args);
};

const fetch_grid_data = async (name, con) =>{
    var grid_rows = [];
    var grid_template_columns = "";
    var grid_row_width = 0;
    var grid_row_count = 1;

    const grid_header = [];

    var colindex = 1;
    grid_row_width += 65;
    grid_template_columns += "65px ";
    grid_header.push(createElement("div", { 
        "role":"columnheader",
        "aria-colindex":colindex,
        "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-frozen csofj7r71_0-beta_1",
        "style":`grid-column-start: ${colindex}; left: var(--frozen-left-0);`
    },[
        createElement("div", { "class":"sb-grid-select-cell__header" },[
            createElement("input", { 
                "aria-label":"Select All",
                "type":"checkbox", 
                "class":"sb-grid-select-cell__header__input"
            }),
            createElement("button", { 
                "type":"button",
                "aria-haspopup":"sb-grid-select-cell__header",
                "class":"menu",
                "data-state":"closed",
                "class":"sbui-dropdown__trigger"
            },[
                createElement( "span", { "class":"sbui-btn-container" }, [
                    createElement( "span", { 
                        "class":"sbui-btn sbui-btn-text sbui-btn--tiny",
                        "style":"padding: 3px;",
                    }, [
                        createElement( "svg", {
                            "xmlns":"http://www.w3.org/2000/svg",
                            "width":"14",
                            "height":"14",
                            "viewBox":"0 0 24 24",
                            "fill":"none",
                            "stroke":"currentColor",
                            "stroke-linecap":"round",
                            "stroke-linejoin":"round",
                            "class":"sbui-icon ",
                        },[
                            createElement( "polyline", { "points":"6 9 12 15 18 9"})
                        ]),
                    ])
                ])
            ])
        ]),
    ]));

    colindex++;
    grid_row_width += 120;
    grid_template_columns += "120px ";
    grid_header.push(createElement("div", { 
        "role":"columnheader",
        "aria-colindex":colindex,
        "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-resizable c6l2wv171_0-beta_1 rdg-cell-frozen csofj7r71_0-beta_1 rdg-cell-frozen-last ch2wcw871_0-beta_1",
        "style":`grid-column-start: ${colindex}; left: var(--frozen-left-1);`
    },[
        createElement("div", { 
            "draggable":"true",
            "data-handler-id":"T145",
            "style":"opacity: 1;"
        },[
            createElement("div", { 
                "class":"sb-grid-column-header sb-grid-column-header--cursor"
            },[
                createElement("div", { "class":"sb-grid-column-header__inner" },[
                    createElement("div", { "class":"sb-grid-column-header__inner__primary-key" },[
                        createElement( "svg", {
                            "xmlns":"http://www.w3.org/2000/svg",
                            "width":"14",
                            "height":"14",
                            "viewBox":"0 0 24 24",
                            "fill":"none",
                            "stroke":"currentColor",
                            "stroke-linecap":"round",
                            "stroke-linejoin":"round",
                            "class":"sbui-icon ",
                        },[
                            createElement( "path", { "d":"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"})
                        ]),
                    ]),
                    createElement("span", { "class":"sb-grid-column-header__inner__name" },"id"),
                    createElement("span", { "class":"sb-grid-column-header__inner__format" },"int8")
                ]),
                createElement("button", { 
                    "type":"button",
                    "aria-haspopup":"sb-grid-select-cell__header",
                    "class":"menu",
                    "data-state":"closed",
                    "class":"sbui-dropdown__trigger"
                },[
                    createElement( "span", { "class":"sbui-btn-container" }, [
                        createElement( "span", { 
                            "class":"sbui-btn sbui-btn-text sbui-btn--tiny",
                            "style":"padding: 3px;",
                        }, [
                            createElement( "svg", {
                                "xmlns":"http://www.w3.org/2000/svg",
                                "width":"14",
                                "height":"14",
                                "viewBox":"0 0 24 24",
                                "fill":"none",
                                "stroke":"currentColor",
                                "stroke-linecap":"round",
                                "stroke-linejoin":"round",
                                "class":"sbui-icon ",
                            },[
                                createElement( "polyline", { "points":"6 9 12 15 18 9"})
                            ]),
                        ])
                    ])
                ])
            ]),
        ]),
    ]));

    const _columns_ref = [];
    const _model = con.model(name);
    const _schema = _model.schema.paths;
    const grid_data = await _model.find({},{},{limit: 100});

    for(key in _schema){
        const { path, instance, enumValues } = _schema[key];

        if(path == '_id' && instance == 'ObjectID'){ }
        else if(path == '__v' && instance == 'Number'){ }
        else {
            _columns_ref.push(path);

            colindex++;
            grid_row_width += 250;
            grid_template_columns += "250px ";
            grid_header.push(createElement("div", { 
                "role":"columnheader",
                "aria-colindex":colindex,
                "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-resizable c6l2wv171_0-beta_1",
                "style":`grid-column-start: ${colindex};`
            },[
                createElement("div", { 
                    "draggable":"true",
                    "data-handler-id":"T15",
                    "style":"opacity: 1;"
                },[
                    createElement("div", { 
                        "class":"sb-grid-column-header"
                    },[
                        createElement("div", { "class":"sb-grid-column-header__inner" },[
                            createElement("span", { "class":"sb-grid-column-header__inner__name" },path),
                            createElement("span", { "class":"sb-grid-column-header__inner__format" },instance)
                        ]),
                        createElement("button", { 
                            "type":"button",
                            "aria-haspopup":"sb-grid-select-cell__header",
                            "class":"menu",
                            "data-state":"closed",
                            "class":"sbui-dropdown__trigger"
                        },[
                            createElement( "span", { "class":"sbui-btn-container" }, [
                                createElement( "span", { 
                                    "class":"sbui-btn sbui-btn-text sbui-btn--tiny",
                                    "style":"padding: 3px;",
                                }, [
                                    createElement( "svg", {
                                        "xmlns":"http://www.w3.org/2000/svg",
                                        "width":"14",
                                        "height":"14",
                                        "viewBox":"0 0 24 24",
                                        "fill":"none",
                                        "stroke":"currentColor",
                                        "stroke-linecap":"round",
                                        "stroke-linejoin":"round",
                                        "class":"sbui-icon ",
                                    },[
                                        createElement( "polyline", { "points":"6 9 12 15 18 9"})
                                    ]),
                                ])
                            ])
                        ])
                    ]),
                ]),
            ]));
        }
    }

    colindex++;
    grid_row_width += 100;
    grid_template_columns += "100px";
    grid_header.push(createElement("div", { 
        "role":"columnheader",
        "aria-colindex":colindex,
        "class":"rdg-cell cj343x071_0-beta_1",
        "style":`grid-column-start: ${colindex};`
    },[
        createElement("div", { "class":"sb-grid-add-column" },[
            createElement("span", { "class":"sbui-btn-container sbui-btn--w-full" },[
                createElement("button", { 
                    "class":"sbui-btn sbui-btn-text sbui-btn--w-full sbui-btn--tiny"
                },[
                    createElement( "svg", {
                        "xmlns":"http://www.w3.org/2000/svg",
                        "width":"14",
                        "height":"14",
                        "viewBox":"0 0 24 24",
                        "fill":"none",
                        "stroke":"currentColor",
                        "stroke-linecap":"round",
                        "stroke-linejoin":"round",
                        "class":"sbui-icon ",
                    },[
                        createElement( "line", { "x1":"12", "y1":"5", "x2":"12", "y2":"19"}),
                        createElement( "line", { "x1":"5", "y1":"12", "x2":"19", "y2":"12"})
                    ]),
                ])
            ]),
        ]),
    ]));


    grid_rows.push(createElement("div", { 
        "role":"row",
        "aria-rowindex":"1",
        "class":"rdg-header-row hz5s9zk71_0-beta_1"
    },grid_header));
   
    grid_row_count = grid_data.length+1;

    for (var y=0; y<grid_data.length; y++) {
        let row = grid_data[y];

        var _colindex = 1;
        var _grid_row_width = 0;
        const _grid_header = [];
        var _grid_template_columns = "";

        _grid_row_width += 65;
        _grid_template_columns += "65px ";
        _grid_header.push(createElement("div", { 
            "role":"gridcell",
            "aria-readonly":"true",
            "aria-colindex":_colindex,
            "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-frozen csofj7r71_0-beta_1",
            "style":`grid-column-start: ${_colindex}; left: var(--frozen-left-0);`
        },[
            createElement("div", { "class":"sb-grid-select-cell__formatter" },[
                createElement("input", { 
                    "aria-label":"Select",
                    "type":"checkbox", 
                    "class":"rdg-row__select-column__select-action"
                }),
                createElement("span", { "class":"sbui-btn-container" },[
                    createElement("button", { 
                        "class":"sbui-btn sbui-btn-text sbui-btn--tiny rdg-row__select-column__edit-action",
                        "style":"padding: 2px;"
                    },[
                        createElement( "svg", {
                            "xmlns":"http://www.w3.org/2000/svg",
                            "width":"14",
                            "height":"14",
                            "viewBox":"0 0 24 24",
                            "fill":"none",
                            "stroke":"currentColor",
                            "stroke-linecap":"round",
                            "stroke-linejoin":"round",
                            "class":"sbui-icon ",
                        },[
                            createElement( "polyline", { "points":"15 3 21 3 21 9"}),
                            createElement( "polyline", { "points":"9 21 3 21 3 15"}),
                            createElement( "line", { "x1":"21", "y1":"3", "x2":"14", "y2":"10" }),
                            createElement( "line", { "x1":"3", "y1":"21", "x2":"10", "y2":"14"}),
                        ]),
                    ])
                ])
            ]),
        ]));

        _colindex++;
        _grid_row_width += 120;
        _grid_template_columns += "120px ";
        _grid_header.push(createElement("div", { 
            "role":"gridcell",
            "aria-selected":"false",
            "aria-readonly":"true",
            "aria-colindex":_colindex,
            "class":"rdg-cell cj343x071_0-beta_1 rdg-cell-frozen csofj7r71_0-beta_1 rdg-cell-frozen-last ch2wcw871_0-beta_1",
            "style":`grid-column-start: ${_colindex}; left: var(--frozen-left-1);`
        },y+""));

        for (var x=0; x<_columns_ref.length; x++) {
            let col = _columns_ref[x];

            if(col == '_id'){ }
            else if(col == '__v'){ }
            else {
                _colindex++;
                _grid_row_width += 250;
                _grid_template_columns += "250px ";
                _grid_header.push(createElement("div", { 
                    "role":"gridcell",
                    "aria-selected":"false",
                    "aria-readonly":"true",
                    "aria-colindex":_colindex,
                    "class":"rdg-cell cj343x071_0-beta_1",
                    "style":`grid-column-start: ${_colindex};`
                },row[col]+""));
            }
        }

        grid_rows.push(createElement("div", { 
            "aria-selected":"false",
            "style":`top:${((y+1)*35)}px; --row-height:35px;`,
            "role":"row",
            "aria-rowindex":(y+2)+"",
            "class":"rdg-row r1upfr8071_0-beta_1 rdg-row-even"
        },_grid_header));
    }

    return createElement("div", { 
        "role":"grid",
        "aria-multiselectable":"true",
        "aria-colcount":colindex,
        "aria-rowcount":grid_row_count,
        "class":"rdg rnvodz571_0-beta_1",
        "style":`height: 100%; --header-row-height:35px; --row-width:${grid_row_width}px; --summary-row-height:35px; --template-columns:${grid_template_columns}; --frozen-left-0:0px; --frozen-left-1:65px;`
    }, grid_rows );
                
}

const page = (contents) => {

    const view = createElement("html", [
        loadElement('../views/head', {
            title:"Kagaconnect Portal", 
            links:[
                createElement("link", { "rel":"icon", "type":"image/png", "href":"/img/favicon/favicon-32x32.png"}),
                createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/fonts.css"}),
                createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/custom.css"}),
                createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/tooltips.css"}),
                createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/index.css"}),
                createElement("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/grid.css"})
            ], 
            scripts:[
                createElement("script", { "type":"text/javascript", "src":"/script/jquery-3.6.0.min.js"})
            ] 
        }),
        createElement("body", {"class":"dark"}, [
            createElement("div", { "class":"flex"}, contents)
        ])
    ]);

    return view;
};

const render = async (req, res) => { 

    const exclude_dbs = ['admin', 'conFusion', 'config', 'local'];
    const con = new mongoose.mongo.Admin(mongoose.connection.db).listDatabases(function(err, result) {
        for (let db of result.databases) {
            const { name, sizeOnDisk, empty } = db;
            if(!exclude_dbs.includes(name)){ 
                var project = projects.filter(function(p) { return p.name == name; }).shift();
                if(project == undefined || project == null){
                    //var newId = new mongoose.mongo.ObjectId('56cb91bdc3464f14678934ca');
                    //console.log(name+" -> "+newId);
                    //console.log(name+" -> "+mongoose.Types.ObjectId(name));
                    //projects.push({name:name, id:"avpdkvundpuqjmeltijg", location:"af-east-1"});
                    projects.push({name:name, id:uuidv4(), location:"af-east-1"});
                }
            }
        }

        var views = [];
        if(projects.length > 0){
            for (let project of projects) {
                views.push(createElement( "li", { "class":"col-span-1 flex shadow-sm rounded-md" },[
                    createElement( "a", { 
                        "class":"w-full col-span-3 md:col-span-1 ",
                        "href":`/project/${project.id}` 
                    },[
                        createElement( "div", {  "class":"bg-panel-header-light dark:bg-panel-header-dark  hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark  border border-border-secondary-light dark:border-border-secondary-dark  hover:border-border-secondary-hover-light dark:hover:border-border-secondary-hover-dark p-4 h-32 rounded  transition ease-in-out duration-150 flex flex-col justify-between" },[
                            createElement( "h4", {  "class":"sbui-typography-title" }, `${project.name}`),
                            createElement( "div", {  "class":"lowercase" },[
                                createElement( "div", {  "class":"sbui-typography-text" },`${project.location}`) 
                            ]) 
                        ]) 
                    ]) 
                ]));
            }
        }
    
        //const sidebar_args = { selected_page:null };
        const main_args = {
            breadcrumbs:['Projects'],
            views:[
                createElement( "div", { "class":"p-4" },[
                    createElement( "div", { "class":"my-2" },[
                        createElement( "div", { "class":"flex" },[
                            createElement( "div", null,[
                                createElement( "a", { 
                                    "href":"/new/project", 
                                    "type":"button", 
                                    "aria-haspopup":"menu", 
                                    "data-state":"closed", 
                                    "class":"sbui-dropdown__trigger"
                                },[
                                    createElement( "span", { 
                                        "class":"sbui-btn-container"
                                    },[
                                        createElement( "span", { 
                                            "class":"sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center"
                                        },
                                        [ createElement( "span", null,"New project") ])
                                    ])
                                ])
                            ]) 
                        ])
                    ]),
                    createElement( "div", { "class":"my-8 space-y-8" },[
                        createElement( "div", null,[
                            createElement( "ul", { 
                                "class":"grid grid-cols-1 gap-4 mx-auto w-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, 
                                views
                            )
                        ]) 
                    ])
                ]),
            ]
        };
    
        const view = page([
            //loadElement('../views/sidebar', sidebar_args),
            loadElement('../views/main', main_args)
        ]);
    
        res.status(200).send(view.render());

    });    
};

const project = async (req, res) => {
    const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();
        if(project != undefined && project != null){
        const selected_page = "Home";

        const sidebar_args = { project, selected_page };
        const main_args = { 
            project, 
            selected_page, 
            breadcrumbs:['Projects', project.name],
            views:[]
        };

        const view = page([
            loadElement('../views/sidebar', sidebar_args),
            loadElement('../views/main', main_args)
        ]);

        res.status(200).send(view.render());
    }
    else res.status(404).send("Missing project");
};

const editor_table = async (req, res) => {
    const project_id = req.params.id;
    const project = projects.filter(function(p) { return p.id == project_id; }).shift();
    const selected_page = "Table Editor";

    var active_table=0;
    var tables = [];
    
    tables.push(createElement( "div", { "class":"sbui-menu__group" },[
        createElement( "div", { "class":"sbui-space-row sbui-space-x-2" },[
            createElement( "span", { "class":"sbui-typography-text sbui-typography-text-secondary" },"All tables")
        ])
    ]));


    var con = mongoose.connection.useDb(project.name);
    con.db.listCollections().toArray(async function (err, collections) {
        var grid_rows = {};

        collections.sort(function(a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        
        for (var c=0; c<collections.length; c++) {
            let collection = collections[c];
            const { name, type, options, info, idIndex } = collection;

            if(active_table == c){
                grid_rows = await fetch_grid_data(name, con);    

                tables.push(createElement( "div", { 
                    "class":"sbui-menu__item sbui-menu__item--active sbui-menu__item--rounded",
                    "data-project":project_id  
                },[
                    createElement( "span", { "class":"sbui-typography-text" },[
                        createElement( "div", { "class":"sbui-space-row sbui-space-x-2" },[
                            createElement( "span", { "class":"sbui-menu__content w-full" },[
                                createElement( "div", { "class":"flex justify-between" },[
                                    createElement( "span", { "class":"truncate", "style":"opacity: 1;" },name),
                                    createElement( "button", { 
                                        "type":"button",
                                        "aria-haspopup":"menu",
                                        "data-state":"closed",
                                        "class":"sbui-dropdown__trigger"
                                    },[
                                        createElement( "span", { "class":"sbui-btn-container" },[
                                            createElement( "span", { 
                                                "style":"padding: 3px;",
                                                "class":"sbui-btn sbui-btn-text sbui-btn--tiny sbui-btn--text-align-center" 
                                            },[
                                                createElement( "svg", {
                                                    "xmlns":"http://www.w3.org/2000/svg",
                                                    "width":"14",
                                                    "height":"14",
                                                    "viewBox":"0 0 24 24",
                                                    "fill":"none",
                                                    "stroke":"currentColor",
                                                    "stroke-linecap":"round",
                                                    "stroke-linejoin":"round",
                                                    "class":"sbui-icon ",
                                                },[
                                                    createElement( "polyline", { "points":"6 9 12 15 18 9"})
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
                tables.push(createElement( "div", { 
                    "class":"sbui-menu__item sbui-menu__item--rounded",
                    "data-project":project_id 
                },[
                    createElement( "span", { "class":"sbui-typography-text" },[
                        createElement( "div", { "class":"sbui-space-row sbui-space-x-2" },[
                            createElement( "span", { "class":"sbui-menu__content w-full" },[
                                createElement( "div", { "class":"flex justify-between" },[
                                    createElement( "span", { "class":"truncate", "style":"opacity: 1;" },name)
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
                createElement( "div", {  
                    "role":"menu",
                    "aria-orientation":"vertical",
                    "aria-labelledby":"options-menu"
                },[
                    createElement( "div", {  "class":"mt-8" },[
                        createElement( "div", { 
                            "role":"menu",
                            "aria-orientation":"vertical",
                            "aria-labelledby":"options-menu", 
                            "class":"mb-4" 
                        },[
                            createElement( "div", { "class":"my-4 px-3" },[
                                createElement( "div", null,[
                                    createElement( "span", { "class":"sbui-typography-text" },[
                                        createElement( "span", { "class":"sbui-typography-text" },[
                                            createElement( "span", { "class":"sbui-btn-container sbui-btn--w-full" },[
                                                createElement( "button", {
                                                    "style":"justify-content: start;",
                                                    "class":"new-table-button sbui-btn sbui-btn-text sbui-btn--w-full sbui-btn--tiny mx-1 sbui-btn--text-align-center" 
                                                },[
                                                    createElement( "svg", {
                                                        "xmlns":"http://www.w3.org/2000/svg",
                                                        "width":"14",
                                                        "height":"14",
                                                        "viewBox":"0 0 24 24",
                                                        "fill":"none",
                                                        "stroke":"currentColor",
                                                        "stroke-linecap":"round",
                                                        "stroke-linejoin":"round",
                                                        "class":"sbui-icon ",
                                                    },[
                                                        createElement( "line", { "x1":"12", "y1":"5", "x2":"12", "y2":"19"}), 
                                                        createElement( "line", { "x1":"5", "y1":"12", "x2":"19", "y2":"12"})
                                                    ]),
                                                    createElement( "span", null, "New table")
                                                ])
                                            ])
                                        ])
                                    ])
                                ]),
                                createElement( "div", null,[
                                    createElement( "span", { "class":"sbui-typography-text" },[
                                        createElement( "span", { "class":"sbui-menu__content" },[
                                            createElement( "div", { "class":"sbui-input-no-border mx-1" },[
                                                createElement( "div", { "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive" },[
                                                    createElement( "div", { "class":"sbui-formlayout__content-container-horizontal" },[
                                                        createElement( "div", { "class":"sbui-input-container" },[
                                                            createElement( "input", { 
                                                                "placeholder":"Search",
                                                                "type":"text",
                                                                "class":"sbui-input sbui-input--with-icon sbui-input--tiny"  
                                                            }),
                                                            createElement( "div", { "class":"sbui-input-icon-container" }, [
                                                                createElement( "svg", {
                                                                    "xmlns":"http://www.w3.org/2000/svg",
                                                                    "width":"14",
                                                                    "height":"14",
                                                                    "viewBox":"0 0 24 24",
                                                                    "fill":"none",
                                                                    "stroke":"currentColor",
                                                                    "stroke-linecap":"round",
                                                                    "stroke-linejoin":"round",
                                                                    "class":"sbui-icon ",
                                                                },[
                                                                    createElement( "circle", { "cx":"11", "cy":"11", "r":"8"}), 
                                                                    createElement( "line", { "x1":"21", "y1":"21", "x2":"16.65", "y2":"16.65"})
                                                                ]),
                                                            ])
                                                        ])
                                                    ])
                                                ]) 
                                            ]) 
                                        ]) 
                                    ]) 
                                ])
                            ]),                        
                            createElement( "div", { "class":"mt-4 px-3 space-y-4" },[
                                createElement( "div", null, tables)
                            ])
                        ]) 
                    ]) 
                ]) 
            ]
        };
        const main_args = { 
            project, 
            selected_page, 
            breadcrumbs:['Projects', project.name],
            views:[
                createElement("div", { "class":"w-full overflow-y-auto overflow-x-hidden max-w-screen flex flex-col"},[
                    createElement("div", { "class":"relative"}),
                    createElement("div", { "class":"sb-grid"},[
                        createElement("div", { "class":"sb-grid-header"},[
                            createElement("div", { "class":"sb-grid-header__inner"},[
                                createElement( "div", { "class":"sbui-input-container" },[
                                    createElement( "span", { "class":"sbui-btn-container" }, [
                                        createElement( "button", { 
                                            "class":"sbui-btn sbui-btn-text sbui-btn--tiny",
                                            "style":"padding-left: 4px; padding-right: 4px;" 
                                        }, [
                                            createElement( "svg", {
                                                "xmlns":"http://www.w3.org/2000/svg",
                                                "width":"14",
                                                "height":"14",
                                                "viewBox":"0 0 24 24",
                                                "fill":"none",
                                                "stroke":"currentColor",
                                                "stroke-linecap":"round",
                                                "stroke-linejoin":"round",
                                                "class":"sbui-icon ",
                                            },[
                                                createElement( "polyline", { "points":"23 4 23 10 17 10"}), 
                                                createElement( "polyline", { "points":"1 20 1 14 7 14"}),
                                                createElement( "path", { "d":"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"})
                                            ]),
                                            createElement("div", null ,"Refresh")
                                        ])
                                    ]),
                                    createElement( "button", { 
                                        "type":"button",
                                        "aria-haspopup":"menu",
                                        "data-state":"closed",
                                        "class":"sbui-dropdown__trigger",
                                        "style":"margin-top:2px; margin-bottom:1px;",
                                    }, [
                                        createElement( "span", { "class":"sbui-btn-container" }, [
                                            createElement( "span", { "class":"sbui-btn sbui-btn-text sbui-btn--tiny" }, [
                                                createElement( "svg", {
                                                    "xmlns":"http://www.w3.org/2000/svg",
                                                    "width":"14",
                                                    "height":"14",
                                                    "viewBox":"0 0 24 24",
                                                    "fill":"none",
                                                    "stroke":"currentColor",
                                                    "stroke-linecap":"round",
                                                    "stroke-linejoin":"round",
                                                    "class":"sbui-icon ",
                                                },[
                                                    createElement( "polygon", { "points":"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"})
                                                ]),
                                                createElement( "span", null, "Filter")
                                            ])
                                        ])
                                    ]),
                                    createElement( "button", { 
                                        "type":"button",
                                        "aria-haspopup":"menu",
                                        "data-state":"closed",
                                        "class":"sbui-dropdown__trigger",
                                        "style":"margin-top:2px; margin-bottom:1px;",
                                    }, [
                                        createElement( "span", { "class":"sbui-btn-container" }, [
                                            createElement( "span", { "class":"sbui-btn sbui-btn-text sbui-btn--tiny" }, [
                                                createElement( "svg", {
                                                    "xmlns":"http://www.w3.org/2000/svg",
                                                    "width":"14",
                                                    "height":"14",
                                                    "viewBox":"0 0 24 24",
                                                    "fill":"none",
                                                    "stroke":"currentColor",
                                                    "stroke-linecap":"round",
                                                    "stroke-linejoin":"round",
                                                    "class":"sbui-icon ",
                                                },[
                                                    createElement( "line", { "x1":"8", "y1":"6", "x2":"21", "y2":"6"}),
                                                    createElement( "line", { "x1":"8", "y1":"12", "x2":"21", "y2":"12"}),
                                                    createElement( "line", { "x1":"8", "y1":"18", "x2":"21", "y2":"18"}),
                                                    createElement( "line", { "x1":"3", "y1":"6", "x2":"3.01", "y2":"6"}),
                                                    createElement( "line", { "x1":"3", "y1":"12", "x2":"3.01", "y2":"12"}),
                                                    createElement( "line", { "x1":"3", "y1":"18", "x2":"3.01", "y2":"18"}),
                                                ]),
                                                createElement( "span", null, "Sorted by 1 rule")
                                            ])
                                        ])
                                    ]),
                                    createElement( "div", { 
                                        "class":"sbui-divider-vertical sb-grid-header__inner__divider",
                                        "role":"seperator",
                                        "style":"display:inline-flex; margin-left:8px; margin-right:8px;",
                                    }),
                                    createElement( "button", { 
                                        "type":"button",
                                        "aria-haspopup":"menu",
                                        "data-state":"closed",
                                        "style":"margin-top:2px; margin-bottom:1px;",
                                    }, [
                                        createElement( "span", { "class":"sbui-btn-container" }, [
                                            createElement( "span", { "class":"sbui-btn sbui-btn-text sbui-btn--tiny" }, [
                                                createElement( "div", {
                                                    "style":"height:14px; width:0px; margin:0px; padding:0px;"
                                                }),
                                                createElement( "span", { "style":"margin:0px; padding:0px;" }, "New Column")
                                            ])
                                        ])
                                    ]),
                                    createElement( "span", { "class":"sbui-btn-container" }, [
                                        createElement( "button", { 
                                            "class":"sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--tiny sb-grid-header__inner__insert-row",
                                            "style":"padding: 4px 8px;" 
                                        }, [
                                            createElement( "svg", {
                                                "xmlns":"http://www.w3.org/2000/svg",
                                                "width":"14",
                                                "height":"14",
                                                "viewBox":"0 0 24 24",
                                                "fill":"none",
                                                "stroke":"currentColor",
                                                "stroke-linecap":"round",
                                                "stroke-linejoin":"round",
                                                "class":"sbui-icon ",
                                            },[
                                                createElement( "line", { "x1":"12", "y1":"5", "x2":"12", "y2":"19"}),
                                                createElement( "line", { "x1":"5", "y1":"12", "x2":"19", "y2":"12"}),
                                                    
                                            ]),
                                            createElement( "span", null , "Insert row")
                                        ])
                                    ])
                                ])
                            ]),
                            createElement("div", { "class":"sb-grid-header__inner"},[
                    
                            ]),
                        ]),
                        createElement("div", { 
                            "class":"sb-grid-body",
                            "style":"width: 100%; height: 100%;"
                        }, [ grid_rows ] ),
                        createElement("div", { "class":"sb-grid-footer"},[
                            createElement("div", { "class":"sb-grid-footer__inner"},[
                                createElement("div", { "class":"sb-grid-pagination"},[
                                    createElement("span", { "class":"sbui-btn-container"},[
                                        createElement("button", { 
                                            "disabled":"true",
                                            "style":"padding: 3px 10px;",
                                            "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny"
                                        },[
                                            createElement( "svg", {
                                                "xmlns":"http://www.w3.org/2000/svg",
                                                "width":"14",
                                                "height":"14",
                                                "viewBox":"0 0 24 24",
                                                "fill":"none",
                                                "stroke":"currentColor",
                                                "stroke-linecap":"round",
                                                "stroke-linejoin":"round",
                                                "class":"sbui-icon ",
                                            },[
                                                createElement( "line", { "x1":"19", "y1":"12", "x2":"5", "y2":"12" }), 
                                                createElement( "polyline", { "points":"12 19 5 12 12 5"})
                                            ])
                                        ])
                                    ]),
                                    createElement("span", { "class":"sbui-typography-text"},"Page"),
                                    createElement("div", { "class":"sb-grid-pagination-input-container"},[
                                        createElement("div", { "class":"sb-grid-pagination-input"},[
                                            createElement("div", { "class":"sbui-formlayout sbui-formlayout--tiny sbui-formlayout--responsive"},[
                                                createElement("div", { 
                                                    "class":"sbui-formlayout__content-container-horizontal",
                                                    "style":"width: 3rem;" 
                                                },[
                                                    createElement("div", { "class":"sbui-inputnumber-container" },[
                                                        createElement("input", {
                                                             "type":"number",
                                                             "class":"sbui-inputnumber sbui-inputnumber--tiny",
                                                             "min":"1",
                                                             "max":"1",
                                                             "value":"1",
                                                        }),
                                                        createElement("div", { "class":"sbui-inputnumber-nav sbui-inputnumber-nav--tiny" },[
                                                            createElement( "svg", {
                                                                "xmlns":"http://www.w3.org/2000/svg",
                                                                "width":"21",
                                                                "height":"21",
                                                                "viewBox":"0 0 24 24",
                                                                "fill":"none",
                                                                "stroke":"currentColor",
                                                                "stroke-linecap":"round",
                                                                "stroke-linejoin":"round",
                                                                "class":"sbui-icon sbui-inputnumber-button sbui-inputnumber-button-up",
                                                            },[
                                                                createElement( "polyline", { "points":"18 15 12 9 6 15"})
                                                            ]),
                                                            createElement( "svg", {
                                                                "xmlns":"http://www.w3.org/2000/svg",
                                                                "width":"21",
                                                                "height":"21",
                                                                "viewBox":"0 0 24 24",
                                                                "fill":"none",
                                                                "stroke":"currentColor",
                                                                "stroke-linecap":"round",
                                                                "stroke-linejoin":"round",
                                                                "class":"sbui-icon sbui-inputnumber-button sbui-inputnumber-button-down",
                                                            },[
                                                                createElement( "polyline", { "points":"6 9 12 15 18 9"})
                                                            ])
                                                        ]),
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                    ]),
                                    createElement("span", { "class":"sbui-typography-text"},"of 1"),
                                    createElement("span", { "class":"sbui-btn-container"},[
                                        createElement("button", { 
                                            "disabled":"true",
                                            "style":"padding: 3px 10px;",
                                            "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny"
                                        },[
                                            createElement( "svg", {
                                                "xmlns":"http://www.w3.org/2000/svg",
                                                "width":"14",
                                                "height":"14",
                                                "viewBox":"0 0 24 24",
                                                "fill":"none",
                                                "stroke":"currentColor",
                                                "stroke-linecap":"round",
                                                "stroke-linejoin":"round",
                                                "class":"sbui-icon ",
                                            },[
                                                createElement( "line", { "x1":"5", "y1":"12", "x2":"19", "y2":"12" }), 
                                                createElement( "polyline", { "points":"12 5 19 12 12 19"})
                                            ])
                                        ])
                                    ]),
                                    createElement("button", { 
                                        "type":"button",
                                        "aria-haspopup":"menu",
                                        "data-state":"closed",
                                        "class":"sbui-dropdown__trigger"
                                    },[
                                        createElement("span", { "class":"sbui-btn-container"},[
                                            createElement("span", { 
                                                "class":"sbui-btn sbui-btn-outline sbui-btn-container--shadow sbui-btn--tiny",
                                                "style":"padding: 3px 10px;"
                                            },[
                                                createElement("span", null ,"100 rows")
                                            ])
                                        ])
                                    ]),
                                    createElement("span", { "class":"sbui-typography-text"},"2 records"),
                                    
                                ]),
                            ]),
                        ]),
                    ]),
                ]),
                createElement("script", { "type":"text/javascript", "src":"/script/editor_table.js"})
            ]
        };
        
        const view = page([
            loadElement('../views/sidebar', sidebar_args),
            loadElement('../views/options', options_args),
            loadElement('../views/main', main_args)
        ]);

        res.status(200).send(view.render());

    });

    
    
};

const auth_users = async (req, res) => {
    const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();
    const selected_page = "Authentication";

    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Authentication",
        views:[]
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.name, "Authentication"],
        views:[]
    };
    
    const view = page([
        loadElement('../views/sidebar', sidebar_args),
        loadElement('../views/options', options_args),
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const storage_buckets = async (req, res) => {
    const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();
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
        breadcrumbs:['Projects', project.name, "Storage"],
        views:[]
    };

    const view = page([
        loadElement('../views/sidebar', sidebar_args),
        loadElement('../views/options', options_args),
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const editor_sql = async (req, res) => {
    const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();
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
        breadcrumbs:['Projects', project.name],
        views:[]
    };
    
    const view = page([
        loadElement('../views/sidebar', sidebar_args),
        loadElement('../views/options', options_args),
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const database_tables = async (req, res) => {
    const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();
    const selected_page = "Database";

    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Database",
        views:[]
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.name],
        views:[]
    };
    
    const view = page([
        loadElement('../views/sidebar', sidebar_args),
        loadElement('../views/options', options_args),
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const reports = async (req, res) => {
    const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();
    const selected_page = "Reports";
    
    const sidebar_args = { project, selected_page };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.name],
        views:[]
    };
    
    const view = page([
        loadElement('../views/sidebar', sidebar_args),
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const api_default = async (req, res) => {
    const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();
    const selected_page = "API";

    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"API",
        views:[]
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.name],
        views:[]
    };
    
    const view = page([
        loadElement('../views/sidebar', sidebar_args),
        loadElement('../views/options', options_args),
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const settings_general = async (req, res) => {
    const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();
    const selected_page = "Settings";
    
    const sidebar_args = { project, selected_page };
    const options_args = { 
        project, 
        title:"Settings",
        views:[]
    };
    const main_args = { 
        project, 
        selected_page, 
        breadcrumbs:['Projects', project.name, "General Settings"],
        views:[]
    };
    
    const view = page([
        loadElement('../views/sidebar', sidebar_args),
        loadElement('../views/options', options_args),
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const account_me = async (req, res) => {
    
    const selected_page = "Account";
    
    const sidebar_args = { selected_page };
    const main_args = {
        selected_page, 
        breadcrumbs:['Projects', "Account"],
        views:[]
    };

    const view = page([
        loadElement('../views/sidebar', sidebar_args),
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const new_project = async (req, res) => { 

    const main_args = {
        breadcrumbs:[
            createElement( "a", { "href":"/" },[
                createElement( "img", { 
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
            createElement( "div", { "class":"m-10 mx-auto max-w-2xl" },[
                createElement( "section", { "class":"has-slide-in slide-in" },[
                    createElement( "div", { "class":"sbui-loading" },[
                        createElement( "div", { "class":"sbui-loading-content" },[
                            createElement( "form", { 
                                "action":"/projects/new", 
                                "method":"post",
                                "class":"border border-panel-border-light dark:border-panel-border-dark rounded mb-8 undefined" 
                            },[
                                createElement( "div", { "class":"bg-panel-body-light dark:bg-panel-body-dark" },[
                                    createElement( "div", { "class":"px-6 py-4 flex items-center" },[
                                        createElement( "div", null ,[
                                            createElement( "h4", { "class":"sbui-typography-title mb-0" } ,"Create a new project"),
                                        ]),
                                    ]),
                                ]),
                                createElement( "div", { "class":"bg-panel-body-light dark:bg-panel-body-dark" },[
                                    createElement( "div", { "class":"px-6 py-4 pt-0 pb-6" },[
                                        createElement( "span", { "class":"sbui-typography-text" },
                                            "Your project will have its own dedicated instance and full database.<br>An API will be set up so you can easily interact with your new database.<br>"
                                        ),
                                    ]),
                                    createElement( "div", { "class":"px-6 py-4 Form section-block--body has-inputs-centered border-b border-t border-panel-border-interior-light dark:border-panel-border-interior-dark" },[
                                        createElement( "div", { "class":"form-group" },[
                                            createElement( "label", null,"Name"),
                                            createElement( "input", { 
                                                "name":"name",
                                                "class":"form-control text-base",
                                                "type":"text", 
                                                "placeholder":"Project name", 
                                                "value":"", 
                                            }),
                                        ]),
                                    ]),
                                    createElement( "div", { "class":"px-6 py-4 Form section-block--body has-inputs-centered border-b border-panel-border-interior-light dark:border-panel-border-interior-dark" },[
                                        createElement( "div", { "class":"form-group" },[
                                            createElement( "label", null,"Database Password"),
                                            createElement( "input", { 
                                                "name":"db_pass",
                                                "class":"form-control text-base",
                                                "type":"password", 
                                                "placeholder":"Type in a strong password", 
                                                "value":"", 
                                            }),
                                            createElement( "div", {  "class":"form-text form-help" },[
                                                /*createElement( "div", 
                                                { 
                                                    "class":"mb-2 bg-bg-alt-light dark:bg-bg-alt-dark rounded overflow-hidden transition-all border dark:border-dark",
                                                    "aria-valuemax":"100",
                                                    "aria-valuemin":"0",
                                                    "aria-valuenow":"100%",
                                                    "aria-valuetext":"100%",
                                                    "role":"progressbar",
                                                },[
                                                    createElement( "div", { 
                                                        "style":"width: 100%;",
                                                        "class":"relative h-2 w-full bg-green-500 transition-all duration-500 ease-out shadow-inner" 
                                                    }),
                                                ]),
                                                createElement( "span", {  "class":"text-green-600" }, "This password is strong. "),*/
                                                createElement( "span", {  "class":"" }, "This is the password to your postgres database, so it must be a strong password and hard to guess."),
                                            ]),
                                        ]),
                                    ]),
                                    createElement( "div", { "class":"px-6 py-4 Form section-block--body has-inputs-centered" },[
                                        createElement( "div", { "class":"form-group" },[
                                            createElement( "label", null,"Region"),
                                            createElement( "select", {
                                                "name":"db_region",
                                                "class":"form-control"
                                            },[
                                                createElement( "option", {  "value":"af-east-1"}, "East Africa (Tanzania)"),
                                            ]),
                                            createElement( "div", {  "class":"form-text form-help"}, "Select a region close to you for the best performance."),
                                        ]),
                                    ])
                                ]),
                                createElement( "div", { "class":"bg-panel-footer-light dark:bg-panel-footer-dark border-t border-panel-border-interior-light dark:border-panel-border-interior-dark" },[
                                    createElement( "div", { "class":"px-6 h-12 flex items-center" },[
                                        createElement( "div", { "class":"flex items-center w-full justify-between" },[
                                            createElement( "span", { "class":"sbui-btn-container" },[
                                                createElement( "button", { "class":"sbui-btn sbui-btn-default sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" },[
                                                    createElement( "span", null , "Cancel"),
                                                ]),
                                            ]),
                                            createElement( "span", { "class":"space-x-3" },[
                                                createElement( "span", { "class": "sbui-typography-text sbui-typography-text-secondary sbui-typography-text-small" } , "You can rename your project later"),
                                                createElement( "span", { "class":"sbui-btn-container" },[
                                                    createElement( "button", { 
                                                        "type":"submit",
                                                        "name":"submit",
                                                        "class":"sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" 
                                                    },[
                                                        createElement( "span", null , "Create new project"),
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
        loadElement('../views/main', main_args)
    ]);

    res.status(200).send(view.render());
};

const authenticate = async (req, res, next) => {
    /*const token = fetchToken(req);

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }*/


  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2JpbGUiOiIyNTU3Mzg3MjU0NDYiLCJpYXQiOjE2MzE3OTMyODIsImV4cCI6MTYzMTg3OTY4Mn0.j7E90parE4tZ9_3nLorIQuVSgBQEHcFntxenAHj5_EI';
  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
    return next();
};

const use = (app) => {    
    app.get("/", render);
    app.post("/", render);
    app.put("/", render);
    app.delete("/", render);
    app.patch("/", render);

    app.get("/project/:id/editor/table/:table", authenticate, async (req, res) => {        
        const table = req.params.table;

        try{
            const project = projects.filter(function(p) { return p.id == req.params.id; }).shift();       
            var con = await mongoose.connection.useDb(project.name);
            
            const grid_rows = await fetch_grid_data(table, con);
            res.status(200).send(grid_rows.render());
        }
        catch(e){
            res.status(501).send(e.message);
        }
    });
    app.get("/project/:id/editor/table", authenticate, editor_table);

    app.get("/project/:id/auth/users", authenticate, auth_users);
    app.get("/project/:id/storage/buckets", authenticate, storage_buckets);
    app.get("/project/:id/editor/sql", authenticate, editor_sql);
    app.get("/project/:id/database/tables", authenticate, database_tables);
    app.get("/project/:id/reports", authenticate, reports);
    app.get("/project/:id/api/default", authenticate, api_default);
    app.get("/project/:id/settings/general", authenticate, settings_general);
    app.get("/account/me", authenticate, account_me);
    app.get("/project/:id", authenticate, project);

    app.get("/new/project", authenticate, new_project);
    app.post("/projects/new", authenticate, async (req, res) => {
        
        const { name, db_pass, db_region } = req.body;

        projects.push({name:name, id:'avpdkvundpuqjmeltijg', location:db_region});
        
        render(req, res);
    });
};

module.exports = {
    createElement, 
    loadElement, 
    authenticate,
    use,
    functionify
};