const ViewEngine = require("../lib/view_engine");

const createElement = (args) => {

    var content = [];
    const { project, views, title } = args;

    if(views != undefined && views != null){
        for (let vw of views) {
            content.push(vw);
        }
    }

    const view = ViewEngine.createElement("div", { 
        "id":"with-sidebar",
        "class":"w-64 h-screen overflow-auto bg-sidebar-linkbar-light dark:bg-sidebar-linkbar-dark hide-scrollbar border-r dark:border-dark" // hide-sidebar
    }, [
        ViewEngine.createElement( "div", { "class":"mb-2" }, [
            ViewEngine.createElement( "div", { "class":"max-h-12 h-12 flex items-center border-b dark:border-dark px-6" }, [
                ViewEngine.createElement( "h4", { "class":"sbui-typography-title mb-0" }, title)
            ])
        ]),
        ViewEngine.createElement( "div", { "class":"-mt-1" }, content)
    ]);

    return view;
};

module.exports = {createElement};