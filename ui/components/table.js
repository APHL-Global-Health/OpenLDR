const view_engine = require("../lib/view_engine");

const create = (content, args) => {

    const parms = { "class":"table" };

    if(args !=undefined && args != null){
        if(args.class !=undefined && args.class != null)parms.class = args.class;
    }

    return view_engine.createElement( "table", parms, content);
};

const thead = (content) => {
    return view_engine.createElement( "thead", null, content);
};

const tbody = (content) => {
    return view_engine.createElement( "tbody", null, content);
};

const tr = (content, args) => {
    return view_engine.createElement( "tr", args, content);
};

const th = (content, args) => {
    return view_engine.createElement( "th", args, content);
};

const td = (content, args) => {
    return view_engine.createElement( "td", args, content);
};

module.exports = {create, thead, tbody, tr, th, td};