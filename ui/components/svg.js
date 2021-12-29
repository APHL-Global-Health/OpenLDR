const view_engine = require("../lib/view_engine");

const create = (content, args) => {

    const parms = {
        "xmlns":"http://www.w3.org/2000/svg",
        "width":"14",
        "height":"14",
        "viewBox":"0 0 24 24",
        "fill":"none",
        "stroke":"currentColor",
        "stroke-linecap":"round",
        "stroke-linejoin":"round",
        "class":"sbui-icon ",
    };

    if(args !=undefined && args != null){
        if(args.width !=undefined && args.width != null)parms.width = args.width;
        if(args.height !=undefined && args.height != null)parms.height = args.height;
        if(args.viewBox !=undefined && args.viewBox != null)parms.viewBox = args.viewBox;
        if(args.fill !=undefined && args.fill != null)parms.fill = args.fill;
        if(args.stroke !=undefined && args.stroke != null)parms.stroke = args.stroke;
        if(args["stroke-linecap"] !=undefined && args["stroke-linecap"] != null)parms["stroke-linecap"] = args["stroke-linecap"];
        if(args["stroke-linejoin"] !=undefined && args["stroke-linejoin"] != null)parms["stroke-linejoin"] = args["stroke-linejoin"];
        if(args.class !=undefined && args.class != null)parms.class = args.class;
    }

    return view_engine.createElement( "svg", parms, content);
};

const polyline = (args) => {
    return view_engine.createElement( "polyline", { "points":args });
};

const line = (x1, y1, x2, y2) => {
    return view_engine.createElement( "line", { "x1":`${x1}`, "y1":`${y1}`, "x2":`${x2}`, "y2":`${y2}` });
};

const path = (args) => {
    return view_engine.createElement( "path", { "d":args });
};

const circle = (cx, cy, r) => {
    return view_engine.createElement( "circle", { "cx":`${cx}`, "cy":`${cy}`, "r":`${r}` });
};

const rect = (x, y, width, height, rx, ry) => {
    return view_engine.createElement( "rect", { "x":`${x}`, "y":`${y}`, "width":`${width}`, "height":`${height}`, "rx":`${rx}`, "ry":`${ry}` });
};

module.exports = {create, polyline, line, path, circle, rect};