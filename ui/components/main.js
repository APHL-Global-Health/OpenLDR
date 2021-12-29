const ViewEngine = require("../lib/view_engine");

const createElement = (args) => {

    var content = [], crumbs = [];
    const { project, views, breadcrumbs } = args;

    if(views != undefined && views != null){
        for (let vw of views) {
            content.push(vw);
        }
    }

    if(breadcrumbs != undefined && breadcrumbs != null){
        for (var x=0; x<breadcrumbs.length; x++) {
            let crumb = breadcrumbs[x];
            if(x>0){
                crumbs.push(ViewEngine.createElement( "span", { "class":"sbui-typography-text mx-2" },[
                    ViewEngine.createElement( "svg", { 
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
                        ViewEngine.createElement( "polyline", { "points":"9 18 15 12 9 6" })
                    ])
                ]));
            }

            if(typeof crumb == "string"){
                if(x<=1){
                    crumbs.push(ViewEngine.createElement( "button", { 
                        "type":"button",
                        "aria-haspopup":"menu",
                        "data-state":"closed",
                        "class":"sbui-dropdown__trigger"
                    },[
                        ViewEngine.createElement( "span", { "class":"sbui-btn-container" },[
                            ViewEngine.createElement( "span", { "class":"sbui-btn sbui-btn-text sbui-btn--tiny" },[
                                ViewEngine.createElement( "span", null ,crumb)
                            ])
                        ])
                    ]));
                }
                else{
                    crumbs.push(ViewEngine.createElement( "span", { "class":"sbui-typography-text" },[
                        ViewEngine.createElement( "a", { 
                            "class":"block px-2 py-1 text-sm leading-5 text-gray-400 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
                        },crumb)
                    ]));
                }
            }
            else if(crumb != null && crumb != undefined) crumbs.push(crumb);
        }
    }

    const view = ViewEngine.createElement("div", { "class":"flex-1 overflow-auto h-screen"}, [
        ViewEngine.createElement( "div", { 
            "class":"pl-2 pr-2 max-h-12 h-12 border-b dark:border-dark", 
            "style":"min-height:48px; max-height:48px;" 
        }, [
            ViewEngine.createElement( "div", { "class":"PageHeader" }, [
                ViewEngine.createElement( "div", { "class":"Breadcrumbs flex justify-between" }, [
                    ViewEngine.createElement( "div", { 
                        "class":"text-sm flex items-center crumbs-holder",
                        "style":"min-height:48px; max-height:48px;" 
                    }, crumbs),
                    ViewEngine.createElement( "form", {
                        "method":"post",
                        "action":"/logout",
                        "class":"text-sm flex items-center",
                        "style":"height:43px;"
                    }, [
                        ViewEngine.createElement( "div", { "class":"flex" },[
                            ViewEngine.createElement( "div", { "class":"relative inline-block text-left mr-1" },[
                                ViewEngine.createElement( "div", null,[
                                    ViewEngine.createElement( "span", { "class":"sbui-btn-container" },[
                                        ViewEngine.createElement( "button", {
                                            "type":"submit", 
                                            "class":"sbui-btn sbui-btn-default sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" 
                                        },[
                                            // ViewEngine.createElement( "svg", { 
                                            //     "xmlns":"http://www.w3.org/2000/svg",
                                            //     "width":"14",
                                            //     "height":"14",
                                            //     "viewBox":"0 0 24 24",
                                            //     "fill":"none",
                                            //     "stroke":"currentColor",
                                            //     "stroke-width":"1",
                                            //     "stroke-linecap":"round",
                                            //     "stroke-linejoin":"round",
                                            //     "class":"sbui-icon"
                                            // },[
                                            //     ViewEngine.createElement( "path", { "d":"M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" })
                                            // ]),
                                            ViewEngine.createElement( "span", null, "Logout")
                                        ])
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
            ])
        ]),
        ViewEngine.createElement( "div", { "class":"PageBody flex w-full h-screen-without-header" }, content)
    ]);

    return view;
};

module.exports = {createElement};