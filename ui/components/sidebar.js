const ViewEngine = require("../lib/view_engine");
const svg = require("./svg");

const createSideBarImageElement = (tooltip) =>{
    if(tooltip == "Home"){
        return svg.create([ 
            svg.path("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"),
            svg.polyline("9 22 9 12 15 12 15 22")
        ],{"width":"24", "height":"24", "alt":tooltip, "style":"width: 18px; height: 18px;"});
    }
    else if(tooltip == "Table Editor"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "xmlns:xlink":"http://www.w3.org/1999/xlink",
            "class":"m-auto text-color-inherit", 
            "width":"22px", 
            "height":"19px",
            "viewBox":"0 0 22 19",
            "version":"1.1", 
            "style":"width: 18px; height: 18px;"
        },[
            ViewEngine.createElement("g", { 
                "stroke":"none",
                "stroke-width":"1",
                "fill":"none",
                "fill-rule":"evenodd"
            },[
                ViewEngine.createElement("g", { 
                    "transform":"translate(-967.000000, -2846.000000)",
                    "stroke-width":"2",
                    "stroke":"currentColor"
                },[
                    ViewEngine.createElement("g", { 
                        "transform":"translate(968.000000, 2847.000000)"
                    },[
                        ViewEngine.createElement("rect", { 
                            "x":"0",
                            "y":"0",
                            "width":"20",
                            "height":"17",
                            "rx":"2",
                        }),
                        ViewEngine.createElement("line", { 
                            "x1":"0", "y1":"11", "x2":"21", "y2":"11"
                        }),
                        ViewEngine.createElement("line", { 
                            "x1":"0", "y1":"5.5", "x2":"21", "y2":"5.5"
                        }),
                        ViewEngine.createElement("line", { 
                            "x1":"7", "y1":"0", "x2":"7", "y2":"16"
                        }),
                    ])
                ])
            ])
        ]);
    }
    else if(tooltip == "Authentication"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "class":"m-auto text-color-inherit", 
            "width":"24", 
            "height":"24",
            "viewBox":"0 0 24 24",
            "fill":"none", 
            "stroke":"currentColor", 
            "stroke-width":"2", 
            "stroke-linecap":"round", 
            "stroke-linejoin":"round",
            "alt":tooltip,  
            "style":"width: 18px; height: 18px;"
        },[
            ViewEngine.createElement("path", { "d":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
            ViewEngine.createElement("circle", { "cx":"9", "cy":"7", "r":"4" }),
            ViewEngine.createElement("path", { "d":"M23 21v-2a4 4 0 0 0-3-3.87" }),
            ViewEngine.createElement("path", { "d":"M16 3.13a4 4 0 0 1 0 7.75" }),
        ]);
    }
    else if(tooltip == "Storage"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "class":"m-auto text-color-inherit", 
            "width":"24", 
            "height":"24",
            "viewBox":"0 0 24 24",
            "fill":"none", 
            "stroke":"currentColor", 
            "stroke-width":"2", 
            "stroke-linecap":"round", 
            "stroke-linejoin":"round",
            "alt":tooltip,  
            "style":"width: 18px; height: 18px;"
        },[
            ViewEngine.createElement("path", { "d":"M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" })
        ]);
    }
    else if(tooltip == "SQL" || tooltip == "Console"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "xmlns:xlink":"http://www.w3.org/1999/xlink",
            "class":"m-auto text-color-inherit", 
            "width":"22px", 
            "height":"19px",
            "viewBox":"0 0 22 19",
            "version":"1.1", 
            "style":"width: 18px; height: 18px;"
        },[
            ViewEngine.createElement("g", { 
                "stroke":"none",
                "stroke-width":"1",
                "fill":"none",
                "fill-rule":"evenodd",
                "stroke-linecap":"round",
                "stroke-linejoin":"round"
            },[
                ViewEngine.createElement("g", { 
                    "transform":"translate(-964.000000, -2867.000000)",
                    "stroke-width":"2",
                    "stroke":"currentColor"
                },[
                    ViewEngine.createElement("path", { 
                        "d":"M970.7,2873.47 L973.9,2876.67 L970.7,2879.87 M985,2883 L985,2870.06801 C985,2868.96639 984.109168,2868.07219 983.007556,2868.06803 L967.007556,2868.00758 C965.902994,2868.00341 965.004187,2868.89545 965.000014,2870.00001 C965.000005,2870.00253 965,2870.00505 965,2870.00757 L965,2883 C965,2884.10457 965.895431,2885 967,2885 L983,2885 C984.104569,2885 985,2884.10457 985,2883 Z M976.033333,2879.97 L979.233333,2879.97"
                    })
                ])
            ])
        ]);
    }
    else if(tooltip == "Database"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "class":"m-auto text-color-inherit", 
            "width":"24", 
            "height":"24",
            "viewBox":"0 0 24 24",
            "fill":"none", 
            "stroke":"currentColor", 
            "stroke-width":"2", 
            "stroke-linecap":"round", 
            "stroke-linejoin":"round",
            "alt":tooltip,  
            "style":"width: 18px; height: 18px;"
        },[
            ViewEngine.createElement("ellipse", { "cx":"12", "cy":"5", "rx":"9", "ry":"3" }),
            ViewEngine.createElement("path", { "d":"M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" }),
            ViewEngine.createElement("path", { "d":"M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" })
        ]);
    }
    else if(tooltip == "Reports"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "class":"m-auto text-color-inherit", 
            "width":"24", 
            "height":"24",
            "viewBox":"0 0 24 24",
            "fill":"none", 
            "stroke":"currentColor", 
            "stroke-width":"2", 
            "stroke-linecap":"round", 
            "stroke-linejoin":"round",
            "alt":tooltip,  
            "style":"width: 18px; height: 18px;"
        },[
            ViewEngine.createElement("line", { "x1":"12", "y1":"20", "x2":"12", "y2":"10" }),
            ViewEngine.createElement("line", { "x1":"18", "y1":"20", "x2":"18", "y2":"4" }),
            ViewEngine.createElement("line", { "x1":"6", "y1":"20", "x2":"6", "y2":"16" })
        ]);
    }
    else if(tooltip == "API"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "class":"m-auto text-color-inherit", 
            "width":"24", 
            "height":"24",
            "viewBox":"0 0 24 24",
            "fill":"none", 
            "stroke":"currentColor", 
            "stroke-width":"2", 
            "stroke-linecap":"round", 
            "stroke-linejoin":"round",
            "alt":tooltip,  
            "style":"width: 18px; height: 18px;"
        },[
            ViewEngine.createElement("path", { "d":"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
            ViewEngine.createElement("polyline", { "points":"14 2 14 8 20 8" }),
            ViewEngine.createElement("line", { "x1":"16", "y1":"13", "x2":"8", "y2":"13" }),
            ViewEngine.createElement("line", { "x1":"16", "y1":"17", "x2":"8", "y2":"17" }),
            ViewEngine.createElement("polyline", { "points":"10 9 9 9 8 9" })
        ]);
    }
    else if(tooltip == "Settings"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "class":"m-auto text-color-inherit", 
            "width":"24", 
            "height":"24",
            "viewBox":"0 0 24 24",
            "fill":"none", 
            "stroke":"currentColor", 
            "stroke-width":"2", 
            "stroke-linecap":"round", 
            "stroke-linejoin":"round",
            "alt":tooltip,  
            "style":"width: 18px; height: 18px;"
        },[
            ViewEngine.createElement("circle", { "cx":"12", "cy":"12", "r":"3" }),
            ViewEngine.createElement("path", { "d":"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" }),
        ]);
    }
    else if(tooltip == "Account"){
        return ViewEngine.createElement("svg", { 
            "xmlns":"http://www.w3.org/2000/svg",
            "class":"m-auto text-color-inherit", 
            "width":"24", 
            "height":"24",
            "viewBox":"0 0 24 24",
            "fill":"none", 
            "stroke":"currentColor", 
            "stroke-width":"2", 
            "stroke-linecap":"round", 
            "stroke-linejoin":"round",
            "alt":tooltip,  
            "style":"width: 18px; height: 18px;"
        },[            
            ViewEngine.createElement("path", { "d":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            ViewEngine.createElement("circle", { "cx":"12", "cy":"7", "r":"3" }),
        ]);
    }

    return null;
}

const createSideBarButtonElement = (url, selected, tooltip, content, separator) =>{

    var children = [];

    children.push(ViewEngine.createElement("a", { 
        "href":url, 
        "class": selected ? "inline-flex items-center justify-center h-10 w-10  mx-2 mt-2 rounded bg-sidebar-active-light dark:bg-sidebar-active-dark text-gray-900 dark:text-white"
                          : "inline-flex items-center justify-center h-10 w-10  mx-2 mt-2 rounded text-gray-300 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-bg-alt-dark dark:hover:text-white",
        "style":"position: static;",  
    }, [content]));

    if(separator != undefined && separator != null && separator == true){
        children.push(
            ViewEngine.createElement("div", { "class":"pl-2 pr-2 mt-2"},[
                ViewEngine.createElement("div", { 
                    "class":"sbui-divider sbui-divider--light sbui-divider--no-text", 
                    "role":"seperator", 
                })  
            ])
        );
    }

    return ViewEngine.createElement("div", { "tooltip":tooltip, "flow":"right" }, children);
}

const createSideBarButtons = (buttons) =>{
    var children = [];
    for (let button of buttons) {
        var name = button.name;
        var content = createSideBarImageElement(name);
        if(content != undefined && content != null){
            children.push(createSideBarButtonElement(button.url, button.selected, name, content, button.separator));
        }
    }
    
    return children;
}

const project_id_to_url = (id) =>{
    //return id != undefined && id != null && id.trim().length > 0 ? `/project/${id}` : '/project';
    return '/project';
}

const createElement = (args) => {

    var content = [], buttons = [];
    const { project, selected_page } = args;
    
    if(project != undefined && project != null){
        buttons = [
            {name:"Home", selected:(selected_page == "Home"), separator:false, url:project_id_to_url(project.id)},
            {name:"Table Editor", selected:(selected_page == "Table Editor"), separator:false, url:`${project_id_to_url(project.id)}/editor/table`},
            {name:"Authentication", selected:(selected_page == "Authentication"), separator:false, url:`${project_id_to_url(project.id)}/auth/users`},
            //{name:"Storage", selected:(selected_page == "Storage"), separator:false, url:`${project_id_to_url(project.id)}/storage/buckets`},
            //{name:"SQL", selected:(selected_page == "SQL"), separator:false, url:`${project_id_to_url(project.id)}/editor/sql`},
            
            {name:"Console", selected:(selected_page == "Console"), separator:false, url:`${project_id_to_url(project.id)}/console`},
            {name:"Database", selected:(selected_page == "Database"), separator:true, url:`${project_id_to_url(project.id)}/database/tables`},
            {name:"Reports", selected:(selected_page == "Reports"), separator:false, url:`${project_id_to_url(project.id)}/reports`},
            {name:"API", selected:(selected_page == "API"), separator:false, url:`${project_id_to_url(project.id)}/api/default`},
            {name:"Settings", selected:(selected_page == "Settings"), separator:false, url:`${project_id_to_url(project.id)}/settings/general`},
        ];
    }

    content.push( createSideBarButtonElement(
        "/",
        selected_page == undefined || selected_page == null,
        "Home",
        ViewEngine.createElement("img", { 
            "src":"/img/logos/supabase-logo.svg",
            "alt":"home", 
            "class":"m-auto text-color-inherit", 
            "style":"height: 30px;", 
        }),
        true
    ));

    content.push(ViewEngine.createElement("div", { "class":"flex-auto" },
        createSideBarButtons(buttons)
    ));

    if(selected_page != undefined && selected_page != null){
        content.push(createSideBarButtonElement(
            `/account/me`,
            selected_page == "Account", 
            "Account", 
            createSideBarImageElement("Account"), 
            false
        ));
    }

    const view = ViewEngine.createElement("div", { 
        "class":"w-14 h-screen bg-sidebar-light dark:bg-sidebar-dark border-r dark:border-dark" }, [
            ViewEngine.createElement("div", { "class":"flex flex-col h-full" }, content)
        ]);

    return view;
};

module.exports = {createElement};