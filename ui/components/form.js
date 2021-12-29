const view_engine = require("../lib/view_engine");
const svg = require("../components/svg");

const create = (content) => {
    return view_engine.createElement( "section", null, [
        view_engine.createElement( "section", {  "class":"section-block mb-8" }, content)
    ]);
};

const header = (title, description) => {
    if(description != undefined && description != null){
        return view_engine.createElement( "div", {  "class":"bg-panel-header-light dark:bg-panel-header-dark border-b border-panel-border-interior-light dark:border-panel-border-interior-dark" }, [
            view_engine.createElement( "div", {  "class":"px-6 py-4 flex items-center" }, [
                view_engine.createElement( "div", {  "class":"space-y-3" }, [
                    view_engine.createElement( "h5", {  "class":"sbui-typography-title" }, title),
                    view_engine.createElement( "span", {  "class":"sbui-typography-text block sbui-typography-text-secondary" }, description)
                ])
            ])
        ]);
    }
    else {
        return view_engine.createElement( "div", {  "class":" px-6 h-12  bg-panel-header-light dark:bg-panel-header-dark  border-b border-panel-border-light dark:border-panel-border-dark  flex overflow-hidden items-center" }, [
            view_engine.createElement( "div", {  "class":"flex-1 text-left" }, [
                view_engine.createElement( "h6", {  "class":"sbui-typography-title" }, title),
            ])
            //------------buttons??
        ]);
    }
};

const input = (title, value, info, args) => {
    return view_engine.createElement( "div", args, [
        view_engine.createElement( "div", { "style":"padding-top: 1rem;" }, [
            view_engine.createElement( "div", null, [
                view_engine.createElement( "div", { "class":"sbui-formlayout sbui-formlayout--medium sbui-formlayout--responsive" }, [ // items-center
                    view_engine.createElement( "div", { "class":"sbui-space-col sbui-space-y-2 sbui-formlayout__label-container-vertical" }, [
                        view_engine.createElement( "label", { "class":"sbui-formlayout__label" }, title)
                    ]),
                    view_engine.createElement( "div", { "class":"sbui-formlayout__content-container-vertical", "style":"padding-top:4px;" }, [
                        view_engine.createElement( "div", { "class":"sbui-input-container" }, [
                            view_engine.createElement( "input", { 
                                "type":"text",
                                "value":value,
                                "class":"sbui-input sbui-input--medium"
                            })
                        ]),
                        view_engine.createElement( "p", { "class":"sbui-formlayout__description" }, info )
                    ])
                ])
            ])
        ])
    ]);
};

const input_with_copy = (title, value, info, args, button_text) => {
    if(button_text == undefined || button_text == null)button_text = "Copy";

    let button_attributes = null;
    if(button_text == "Copy"){
        button_attributes = {
            "onclick":"copyTextToClipboard($(this).parents('.input-button-container').find('.sbui-input.sbui-input--medium').val())"
        };
    }

    return view_engine.createElement( "div", args, [
        view_engine.createElement( "div", { "style":"padding-top: 1rem;" }, [
            view_engine.createElement( "div", null, [
                view_engine.createElement( "div", { "class":"sbui-formlayout sbui-formlayout--medium sbui-formlayout--responsive" }, [ // items-center
                    view_engine.createElement( "div", { "class":"sbui-space-col sbui-space-y-2 sbui-formlayout__label-container-vertical" }, [
                        view_engine.createElement( "label", { "class":"sbui-formlayout__label" }, title)
                    ]),
                    view_engine.createElement( "div", { "class":"sbui-formlayout__content-container-vertical", "style":"padding-top:4px;" }, [
                        view_engine.createElement( "div", { "class":"sbui-input-container input-button-container" }, [
                            view_engine.createElement( "input", { 
                                "type":"text",
                                "value":value,
                                "class":"sbui-input sbui-input--medium"
                            }),
                            view_engine.createElement( "div", { "class":"sbui-space-row sbui-space-x-1 sbui-input-actions-container" },[
                                view_engine.createElement( "div", { "class":"sbui-btn-container" },[
                                    view_engine.createElement( "button", { "class":"sbui-btn sbui-btn-default sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" },[
                                        svg.create([ 
                                            svg.rect(9, 9, 13, 13, 2, 2),
                                            svg.path("M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1") 
                                        ]),
                                        view_engine.createElement( "span", button_attributes, button_text)
                                    ])
                                ])
                            ])
                        ]),
                        view_engine.createElement( "p", { "class":"sbui-formlayout__description" }, info )
                    ])
                ])
            ])
        ])
    ]);
};

const section = (content, args) => {
    return view_engine.createElement( "div", args, content);
};

const tablist = (tabs) => {
    const _header = [];
    const _tabs = [];

    tabs.forEach((tab, index)=>{
        _header.push(view_engine.createElement( "span", { "class":"sbui-btn-container" }, [            
            view_engine.createElement( "button", { 
                "class": `tab-button sbui-btn sbui-btn-text sbui-btn--tiny sbui-tab-button-underline sbui-btn--text-align-center ${tab.selected ? "sbui-tab-button-underline--active" : ""}`,
                "aria-selected":"true",
                "aria-controls":tab.id,
                "tabindex":`${tab.selected ? 0 : -1}`,
                "role":"tab"
            }, [ view_engine.createElement( "span", null, tab.id.toUpperCase()) ])
        ])); 
        

        const tab_option = { 
            "id":tab.id,
            "role":"tabpanel",
            "tabindex":`${tab.selected ? 0 : -1}`,
            "aria-labelledby":tab.id
        };

        if(!tab.selected)tab_option.hidden = "true";

        _tabs.push(view_engine.createElement( "div", tab_option, [
            view_engine.createElement( "div", null, [
                view_engine.createElement( "div", { "class":"sbui-formlayout sbui-formlayout--medium sbui-formlayout--responsive" }, [
                    view_engine.createElement( "div", { "class":"sbui-formlayout__content-container-horizontal" }, [
                        view_engine.createElement( "div", { "class":"sbui-input-container" }, [
                            view_engine.createElement( "input", { 
                                "disabled":"true",
                                "type":"text",
                                "class":"sbui-input sbui-input--medium",
                                "readonly":"true",
                                "value":`${tab.connection_string}`,
                            }),
                            view_engine.createElement( "div", { "class":"sbui-space-row sbui-space-x-1 sbui-input-actions-container" }, [
                                view_engine.createElement( "div", { "class":"sbui-btn-container" }, [
                                    view_engine.createElement( "button", { "class":"sbui-btn sbui-btn-default sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center" }, [
                                        svg.create([ 
                                            svg.rect(9, 9, 13, 13, 2, 2),
                                            svg.path("M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1") 
                                        ]),
                                        view_engine.createElement( "span", null, "copy")
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
            ])
        ]));
    });

    

    return view_engine.createElement( "div", { "class":"bg-panel-body-light dark:bg-panel-body-dark" }, [
        view_engine.createElement( "div", { "class":"px-6 py-4" }, [
            view_engine.createElement( "div", { "class":"tabs-container sbui-space-col sbui-space-y-4" }, [
                view_engine.createElement( "div", { "role":"tablist", "style":"margin-bottom:16px;" }, [
                    view_engine.createElement( "div", { "class":"sbui-space-row sbui-space-x-0 sbui-tab-bar-container" }, [
                        view_engine.createElement( "div", { "class":"sbui-space-row sbui-space-x-6 sbui-tab-bar-inner-container" }, _header)
                    ]),
                    view_engine.createElement( "div", { "class":"sbui-divider sbui-divider--no-text", "role":"seperator" }),
                ]),
                ..._tabs
            ])
        ])
    ]);
};

const textarea = (title, value, info, args) => {
    return view_engine.createElement( "div", args, [
        view_engine.createElement( "div", { "style":"padding-bottom: 1rem;" }, [
            view_engine.createElement( "div", null, [
                view_engine.createElement( "div", { "class":"sbui-formlayout sbui-formlayout--medium sbui-formlayout--responsive" }, [ // items-center
                    view_engine.createElement( "div", { "class":"sbui-space-col sbui-space-y-2 sbui-formlayout__label-container-vertical" }, [
                        view_engine.createElement( "label", { "class":"sbui-formlayout__label" }, title)
                    ]),
                    view_engine.createElement( "div", { "class":"sbui-formlayout__content-container-vertical", "style":"padding-top:4px;" }, [
                        view_engine.createElement( "div", { "class":"sbui-input-container" }, [
                            view_engine.createElement( "textarea", { 
                                "rows":"6",
                                "class":"font-mono form-control",
                                "style":"padding: .5rem .75rem; margin:0px; line-height: 1.5rem; width:100%;"
                            }, value)
                        ]),
                        view_engine.createElement( "p", { "class":"sbui-formlayout__description" }, info )
                    ])
                ])
            ])
        ])
    ]);
};

const switcher = (title, value, info, args) => {
    return view_engine.createElement( "div", args, [
        view_engine.createElement( "div", { "style":"padding-top: 1rem;" }, [
            view_engine.createElement( "div", null, [
                view_engine.createElement( "div", { "class":"sbui-formlayout sbui-formlayout--medium sbui-formlayout--responsive" }, [ // items-center
                    view_engine.createElement( "div", { "class":"sbui-space-col sbui-space-y-2 sbui-formlayout__label-container-vertical" }, [
                        view_engine.createElement( "label", { "class":"sbui-formlayout__label" }, title)
                    ]),
                    view_engine.createElement( "div", { "class":"sbui-formlayout__content-container-vertical", "style":"padding-top:4px;" }, [
                        view_engine.createElement( "div", { "class":"form-control flex items-center" }, [
                            view_engine.createElement( "span", { 
                                "role":"checkbox",
                                "aria-checked":"false",
                                "class":`${value ? "bg-green-500" : "bg-gray-200"} h-6 w-11 border-2 cursor-pointer relative inline-block flex-shrink-0 border-transparent rounded-full transition-colors ease-in-out duration-200 focus:outline-none focus:ring`
                            },[
                                view_engine.createElement( "span", { 
                                    "aria-hidden":"true",
                                    "class":`${value ? "translate-x-5" : "translate-x-0"} cursor-pointer bg-white  h-5 w-5 inline-block rounded-full shadow transform transition ease-in-out duration-200`
                                },[
                                    
                                ])
                            ])
                        ]),
                        view_engine.createElement( "p", { "class":"sbui-formlayout__description" }, info )
                    ])
                ])
            ])
        ])
    ]);
};

module.exports = {create, header, input, section, input_with_copy, tablist, textarea, switcher};