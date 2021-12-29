const ViewEngine = require("../lib/view_engine");

const createElement = (args) => {

    const { title, links, scripts } = args;

    var children = [];
    children.push(ViewEngine.createElement("meta", { "charset":"utf-8"}));
    children.push(ViewEngine.createElement("meta", { "name":"viewport", "content":"initial-scale=1.0, width=device-width"}));
    children.push(ViewEngine.createElement("meta", { "og:title":"viewport", "property":"og:title", "content":title}));
    children.push(ViewEngine.createElement("meta", { "og:description":"viewport", "property":"og:description", "content":title}));
    //children.push(ViewEngine.createElement("meta", { "og:image":"viewport", "property":"og:image", "content":"https://api.kagaconnect.com/img/lisbase-og-image.png"}));
    children.push(ViewEngine.createElement("title", null, title));

    if(links != undefined && links != null && links instanceof Array){
        for (let link of links) {
            children.push(link);
        }
    }

    if(scripts != undefined && scripts != null && scripts instanceof Array){
        for (let script of scripts) {
            children.push(script);
        }
    }
    
    return ViewEngine.createElement("head", children);

};

module.exports = {createElement};