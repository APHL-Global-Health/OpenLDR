const view_engine = require("../lib/view_engine");

const create = (tag, attrs, content) => {
    return view_engine.createElement( tag, attrs, content);
};

const div = (attrs, content) => { return create( "div", attrs, content); };
const span = (attrs, content) => { return create( "span", attrs, content); };
const button = (attrs, content) => { return create( "button", attrs, content); };


const script = (func, options) => { 
    return view_engine.createElement("script", null, 
        view_engine.functionify(func, options)
    );
};


module.exports = {create, div, span, button, script};