//dependencies
const fs = require('fs');
const path = require('path');
var {EventEmitter} = require('events');

//middleware
const logger = require("../lib/logger");

const sql_check_list = [
    "--",
    ";--",
    ";",
    "/*",
    "*/",
    "@@",
    "@",
    "char",
    "nchar",
    "varchar",
    "nvarchar",
    "alter",
    "begin",
    "cast",
    "create",
    "cursor",
    "declare",
    "delete",
    "drop",
    "end",
    "exec",
    "execute",
    "fetch",
    "insert",
    "kill",
    "select",
    "sys",
    "sysobjects",
    "syscolumns",
    "table",
    "update"
];

const loaded_models = new Map();

const triggers  = (schema, events) => {
    const list = [
        'count', 
        'countDocuments', 
        'deleteMany', 
        'deleteOne', 
        'estimatedDocumentCount', 
        'find', 
        'findOne', 
        'findOneAndDelete', 
        'findOneAndRemove', 
        'findOneAndReplace', 
        'findOneAndUpdate', 
        'remove', 
        'replaceOne', 
        'save',
        'update', 
        'updateOne', 
        'updateMany',
        'validate'
    ];

    for (const action of list) {
        schema.post(action, function(data) {
            events.emit(`post_${action}`, data);     
        });

        schema.pre(action, function(next) {
            events.emit(`pre_${action}`, this); 
            next();    
        });
    }
};

const model  = (file, dir, mongoose) => {
    try 
    {
        const dotenv = require('dotenv');
        const config = dotenv.parse(fs.readFileSync(path.join(dir +'/.env')));
      
        if(config != undefined && config != null){
            //const schema_file = JSON.parse(fs.readFileSync(path.join(__dirname + `/${file}`)));
            let model_name = path.parse(file).name;
            if(model_name.startsWith("data_"))
                model_name = model_name.replace(/data_/, `${config.DB_DATA}_`);
            else if(model_name.startsWith("dictionary_"))
                model_name = model_name.replace(/dictionary_/, `${config.DB_DICT}_`);

            if(!loaded_models.has(model_name)){

                const schema_file = require(path.join(dir + `/${file}`));
                if(path.parse(file).name == "dictionary_roles"){
                    schema_file.permissions = [{
                        type: mongoose.Schema.Types.ObjectId,
                        ref: `${config.DB_DICT}_permissions`
                    }];
                    schema_file.users = [{
                        type: mongoose.Schema.Types.ObjectId,
                        ref: `${config.DB_DICT}_users`
                    }];
                }
                else if(path.parse(file).name == "dictionary_permissions" ||
                       path.parse(file).name == "dictionary_users"){
                    schema_file.role = {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: `${config.DB_DICT}_roles`
                    };
                }

                const schema = new mongoose.Schema(schema_file);
                const schema_events = new EventEmitter();

                triggers(schema, schema_events);

                const _model = mongoose.model(model_name, schema);
                _model.events = schema_events;

                loaded_models.set(model_name, _model);
                return _model;
            }
            else return loaded_models.get(model_name);
        }
        else {
            const timestamp = logger.get_timestamp();
            var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                console_text += logger.console_color("\x1b[33m", "MONGO".padEnd(7), "\x1b[0m");
                console_text += logger.console_color("\x1b[37m", `Loading module `, "\x1b[0m");
                console_text += logger.console_color("\x1b[32m", `Failed `, "\x1b[0m");
                console.log(console_text);
    
                console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                console_text += logger.console_color("\x1b[31m", "ERROR".padEnd(7), "\x1b[0m");
                console_text += logger.console_color("\x1b[37m", `Config not defined for : ${file}`, "\x1b[0m");
                console.log(console_text);

            return null;
        }

    } catch (err) {
        const timestamp = logger.get_timestamp();
        var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
            console_text += logger.console_color("\x1b[33m", "MONGO".padEnd(7), "\x1b[0m");
            console_text += logger.console_color("\x1b[37m", `Loading module `, "\x1b[0m");
            console_text += logger.console_color("\x1b[32m", `Failed `, "\x1b[0m");
            console.log(console_text);

            console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
            console_text += logger.console_color("\x1b[31m", "ERROR".padEnd(7), "\x1b[0m");
            console_text += logger.console_color("\x1b[37m", err.message, "\x1b[0m");
            console.log(console_text);
    }

    return null;
};

const validate_date = (input) => {
    var date = Date.parse(input);
    if (isNaN(date)) return false;
    else return true;
}

const is_sql_injection = (value) => {
      let is_injection = false;
      let check_string = value.replace("'", "''");

      for (var i = 0; i <= sql_check_list.length - 1; i++){
          if ((check_string.indexOf(sql_check_list[i]) >= 0)){
            is_injection = true;
              break;
          }
      }

      return is_injection;
}

const get_query_key = (value) => {
    value = value.trim();
    
    if (value.toLowerCase().endsWith(".and")){
        if(value.toLowerCase().endsWith(".parentheses.open.and"))
            return {operator:" AND ", value:value.substring(0, value.indexOf(".parentheses.open.and")), parentheses_open:true, parentheses_close:false };
        else if(value.toLowerCase().endsWith(".parentheses.close.and"))
            return {operator:" AND ", value:value.substring(0, value.indexOf(".parentheses.close.and")), parentheses_open:false, parentheses_close:true };
        else
            return {operator:" AND ", value:value.substring(0, value.indexOf(".and")), parentheses_open:false, parentheses_close:false };
    }
    else if (value.toLowerCase().endsWith(".or")){
        if(value.toLowerCase().endsWith(".parentheses.open.or"))
            return {operator:" OR ", value:value.substring(0, value.indexOf(".parentheses.open.or")), parentheses_open:true, parentheses_close:false };
        else if(value.toLowerCase().endsWith(".parentheses.close.or"))
            return {operator:" OR ", value:value.substring(0, value.indexOf(".parentheses.close.or")), parentheses_open:false, parentheses_close:true };
        else
            return {operator:" OR ", value:value.substring(0, value.indexOf(".or")), parentheses_open:false, parentheses_close:false };
    }
    else if (value.toLowerCase().endsWith(".parentheses.open")){
        return {operator:"", value:value.substring(0, value.indexOf(".parentheses.open")), parentheses_open:true, parentheses_close:false };
    }
    else if (value.toLowerCase().endsWith(".parentheses.close")){
        return {operator:"", value:value.substring(0, value.indexOf(".parentheses.close")), parentheses_open:false, parentheses_close:true };
    }

    return {operator:"", value:value, parentheses_open:false, parentheses_close:false };
}

const get_query_value = (value, key, db_driver) => {
    value = value.trim();

    //region IN
    if (value.toLowerCase().startsWith("in.") && value.length > 3){

        const splits = value.substring(3).split("','").map(f=>{
             return f.startsWith("'") ? f.substring(1) : (f.endsWith("'") ? f.substring(0, f.length-1) : f);
        });

        return " " + key + " IN ('" + splits.join("','") + "') ";
    }
    else if (value.toLowerCase().startsWith("ni.") && value.length > 3){

        const splits = value.substring(3).split("','").map(f=>{
            return f.startsWith("'") ? f.substring(1) : (f.endsWith("'") ? f.substring(0, f.length-1) : f);
        });

        return " " + key + " NOT IN ('" + splits.join("','") + "') ";
    }
        
    //endregion

    //region AND/OR IN
    else if (value.toLowerCase().startsWith("an_in.") && value.length > 6){

        const splits = value.substring(6).split("','").map(f=>{
            return f.startsWith("'") ? f.substring(1) : (f.endsWith("'") ? f.substring(0, f.length-1) : f);
        });

        return " AND " + key + " IN ('" + splits.join("','") + "') ";
    }        
    else if (value.toLowerCase().startsWith("or_in.") && value.length > 6){

        const splits = value.substring(6).split("','").map(f=>{
            return f.startsWith("'") ? f.substring(1) : (f.endsWith("'") ? f.substring(0, f.length-1) : f);
        });

        return " OR " + key + " IN ('" + splits.join("','") + "') ";
    }
        
    //endregion

    //region AND/OR NOT IN
    else if (value.toLowerCase().startsWith("an_ni.") && value.length > 6){

        const splits = value.substring(6).split("','").map(f=>{
            return f.startsWith("'") ? f.substring(1) : (f.endsWith("'") ? f.substring(0, f.length-1) : f);
        });

        return " AND " + key + " NOT IN ('" + splits.join("','") + "') ";
    }        
    else if (value.toLowerCase().startsWith("or_ni.") && value.length > 6){

        const splits = value.substring(6).split("','").map(f=>{
            return f.startsWith("'") ? f.substring(1) : (f.endsWith("'") ? f.substring(0, f.length-1) : f);
        });

        return " OR " + key + " NOT IN ('" + splits.join("','") + "') ";
    }        
    //endregion

    //region AND/OR Less Than
    else if (value.toLowerCase().startsWith("lt.") && value.length > 3)
        return " " + key + " < '" + value.substring(3) + "' ";
    else if (value.toLowerCase().startsWith("an_lt.") && value.length > 6)
        return " AND " + key + " < '" + value.substring(6) + "' ";
    else if (value.toLowerCase().startsWith("or_lt.") && value.length > 6)
        return " OR " + key + " < '" + value.substring(6) + "' ";
    //endregion

    //region AND/OR Greater Than
    else if (value.toLowerCase().startsWith("gt.") && value.length > 3)
        return " " + key + " > '" + value.substring(3) + "' ";
    else if (value.toLowerCase().startsWith("an_gt.") && value.length > 6)
        return " AND " + key + " > '" + value.substring(6) + "' ";
    else if (value.toLowerCase().startsWith("or_gt.") && value.length > 6)
        return " OR " + key + " > '" + value.substring(6) + "' ";
    //endregion

    //region AND/OR Less Than Or Equal
    else if (value.toLowerCase().startsWith("le.") && value.length > 3)
        return " " + key + " <= '" + value.substring(3) + "' ";
    else if (value.toLowerCase().startsWith("an_le.") && value.length > 6)
        return " AND " + key + " <= '" + value.substring(6) + "' ";
    else if (value.toLowerCase().startsWith("or_le.") && value.length > 6)
        return " OR " + key + " <= '" + value.substring(6) + "' ";
    //endregion

    //region AND/OR Greater Than Or Equal
    else if (value.toLowerCase().startsWith("ge.") && value.length > 3)
        return " " + key + " >= '" + value.substring(3) + "' ";
    else if (value.toLowerCase().startsWith("an_ge.") && value.length > 6)
        return " AND " + key + " >= '" + value.substring(6) + "' ";
    else if (value.toLowerCase().startsWith("or_ge.") && value.length > 6)
        return " OR " + key + " >= '" + value.substring(6) + "' ";
    //endregion

    //region AND/OR Like
    else if (value.toLowerCase().startsWith("lk.") && value.length > 3)
        return " " + key + " LIKE '" + ((db_driver == "mongodb") ? "" : "%") +value.substring(3) + ((db_driver == "mongodb") ? "" : "%") + "' ";
    else if (value.toLowerCase().startsWith("an_lk.") && value.length > 6)
        return " AND " + key + " LIKE '" + ((db_driver == "mongodb") ? "" : "%") +value.substring(6) + ((db_driver == "mongodb") ? "" : "%") + "' ";
    else if (value.toLowerCase().startsWith("or_lk.") && value.length > 6)
        return " OR " + key + " LIKE '" + ((db_driver == "mongodb") ? "" : "%") +value.substring(6) + ((db_driver == "mongodb") ? "" : "%") + "' ";
    //endregion

    //region AND/OR Not Like
    else if (value.toLowerCase().startsWith("nl.") && value.length > 3)
        return " " + key + " NOT LIKE '" + ((db_driver == "mongodb") ? "" : "%") + value.substring(3) + ((db_driver == "mongodb") ? "" : "%") + "' ";
    else if (value.toLowerCase().startsWith("an_nl.") && value.length > 6)
        return " AND " + key + " NOT LIKE '" + ((db_driver == "mongodb") ? "" : "%") +value.substring(6) + ((db_driver == "mongodb") ? "" : "%") + "' ";
    else if (value.toLowerCase().startsWith("or_nl.") && value.length > 6)
        return " OR " + key + " NOT LIKE '" + ((db_driver == "mongodb") ? "" : "%") +value.substring(6) + ((db_driver == "mongodb") ? "" : "%") + "' ";
    //endregion

    //region AND/OR Equals
    else if (value.toLowerCase().startsWith("eq.") && value.length > 3)
        return " " + key + " = '" + value.substring(3) + "' ";
    else if (value.toLowerCase().startsWith("an_eq.") && value.length > 6)
        return " AND " + key + " = '" + value.substring(6) + "' ";
    else if (value.toLowerCase().startsWith("or_eq.") && value.length > 6)
        return " OR " + key + " = '" + value.substring(6) + "' ";
    //endregion

    //region AND/OR Not Equals
    else if (value.toLowerCase().startsWith("nq.") && value.length > 3)
        return " " + key + " <> '" + value.substring(3) + "' ";
    else if (value.toLowerCase().startsWith("an_nq.") && value.length > 6)
        return " AND " + key + " <> '" + value.substring(6) + "' ";
    else if (value.toLowerCase().startsWith("or_nq.") && value.length > 6)
        return " OR " + key + " <> '" + value.substring(6) + "' ";
    //endregion
}

const get_query = (url, db_driver) => {
                
    if(db_driver == "mongodb"){
        let statement = "";
        for (const [key, value] of url.searchParams) {
            let _key = get_query_key(key);
                
            if (!is_sql_injection(value)){
                var _statement = (_key.parentheses_open ? " ( " : "") + _key.operator + " (";
                var splits = value.split("|");
                for(var s=0; s<splits.length; s++)
                {
                    var script = get_query_value(splits[s], _key.value, db_driver);
                    if (script != undefined && script != null && script.length > 0) _statement += script;
                }
                _statement += " ) ";
                _statement += (_key.parentheses_close ? " ) " : "");
                
                if(_key.parentheses && _statement != " ( () ) ") statement += _statement;
                else if (_statement != " () ") statement += _statement;
            }
        }
        return statement;
    }
    else if(db_driver == "mssql"){
        let statement = "";
        for (const [key, value] of url.searchParams) {
            let _key = get_query_key(key);

            if (!is_sql_injection(value)){
                var _statement = (_key.parentheses_open ? " ( " : "") + _key.operator + " (";
                var splits = value.split("|");
                for(var s=0; s<splits.length; s++)
                {
                    var script = get_query_value(splits[s], _key.value);
                    if (script != undefined && script != null && script.length > 0) _statement += script;
                }
                _statement += ") ";
                _statement += (_key.parentheses_close ? " ) " : "");

                if(_key.parentheses && _statement != " ( () ) ") statement += _statement;
                else if (_statement != (_key.operator + " ()")) statement += _statement;
            }
        }
        return statement;
    }
};

function is_number(x) {
    return parseFloat(x) == x
};

function parse_to_number(x){
    return x==x*1?x*1:x
}

const ast_date_fix = (value) => {
    const dt = new Date(value);
    const hoursDiff = dt.getHours() - dt.getTimezoneOffset() / 60;
    const minutesDiff = (dt.getHours() - dt.getTimezoneOffset()) % 60;
    dt.setHours(hoursDiff);
    dt.setMinutes(minutesDiff);
    return dt;
}

const ast_values = (ast) => {
    if(ast.hasOwnProperty('type')){
        if(ast.type == "expr_list"){
            const { value } = ast;
            var list = [];
            value.forEach(function(obj){
                if(obj.hasOwnProperty('value')){
                    list.push(obj.value);
                }
            });

            
            return list;
        }
        else if (ast.type === 'number') {
            return parse_to_number(obj.value);
        } 
        else if (ast.type === 'string'){
            if(is_number(ast.value)) return parse_to_number(ast.value);
            if(validate_date(ast.value))return ast_date_fix(ast.value);
            return ast.value;
        }
        else if (ast.type === 'bool'){
            return obj.value;
        }
        else if (ast.type === 'null'){
            return null;
        }
        else if (ast.type === 'star'){
            // value = '*';
        }
        else if (['time', 'date', 'timestamp'].includes(ast.type)){
            return ast.value;
            //
        }
        else if (ast.type === 'param'){
            // value = ':' + value;
        }
        else if (ast.type === 'interval') {
            
        }
    }
};

const ast_column = (ast) => {
    if(ast != undefined && ast.hasOwnProperty('type')){
        if(ast.type == "column_ref"){
            const {table, column } = ast;
            return column/*.toLowerCase()*/;
        }
        else return null;
    }
    else return null;
};

const ast_operator = (ast) => {
    if(ast != undefined && ast.hasOwnProperty('type')){
        if(ast.type == "binary_expr"){
            return ast.operator;
        }
        else return null;
    }
    else return null;
};

const ast_symbols = (mongo_ast, operator, value) => {
    if(operator == "IN")mongo_ast['$'+operator.toLowerCase()] = value;
    else if(operator == "NOT IN") mongo_ast["$nin"] = value;
    else if(operator == "=")mongo_ast["$eq"] = value;
    else if(operator == "NOT")mongo_ast["$not"] = value;
    else if(operator == "OR" || operator == "NOR" || operator == "AND"){
        //mongo_ast['$'+operator.toLowerCase()] = [ast_l, ast_r];
        //return mongo_ast;
    }//console.log(daysInMonth);
                                                
    else if(operator == "<>")mongo_ast["$ne"] = value;
    else if(operator == ">")mongo_ast["$gt"] = value;
    else if(operator == ">=")mongo_ast["$gte"] = value;
    else if(operator == "<")mongo_ast["$lt"] = value;
    else if(operator == "<=")mongo_ast["$lte"] = value;
    //else if(operator == "LIKE")mongo_ast = { $regex: `${value}`, $options: 'i' };
    //else if(operator == "NOT LIKE")mongo_ast = { $not: { $regex: `${value}`, $options: 'i' } };
};

const ast_with_parentheses = (ast) => {
    const {operator, left, right, parentheses } = ast;

    if(parentheses != undefined && parentheses) {

        if(operator == "OR" || operator == "NOR" || operator == "AND"){
            const ast_l = ast_to_mongo(left);
            const ast_r = ast_to_mongo(right);

            var mongo_ast = {};
            mongo_ast['$'+operator.toLowerCase()] = [ast_l, ast_r];
            return mongo_ast;
        }
        else{
            var mongo_ast = {};
            var column_l = left.hasOwnProperty('left') ? ast_column(left.left) : ast_column(left);
            var column_r = right.hasOwnProperty('left') ? ast_column(right.left) : ast_column(right);
        
            // console.log("column_l: "+JSON.stringify(column_l));
            // console.log("column_r: "+JSON.stringify(column_r));
            // //console.log(JSON.stringify(ast));

            // //console.log("column_l: "+column_l);
            // //console.log("column_r: "+column_r);

            if(column_l != undefined && column_r == undefined) column_r = column_l;
        
            var oporator_l = ast_operator(left);
            var oporator_r = ast_operator(right);

            if(oporator_l == null && oporator_r == null){
                oporator_l = operator;
                oporator_r = operator;
            }
        
            var value_l = left.hasOwnProperty('right') ? ast_values(left.right) : ast_values(left);
            var value_r = right.hasOwnProperty('right') ? ast_values(right.right) : ast_values(right);

            if(column_l == column_r) {
                mongo_ast[column_l] = {};
                ast_symbols(mongo_ast[column_l], oporator_l, value_l);
                ast_symbols(mongo_ast[column_l], oporator_r, value_r);
            }
            else{
                mongo_ast[column_l] = {};
                mongo_ast[column_r] = {};
                ast_symbols(mongo_ast[column_l], oporator_l, value_l);
                ast_symbols(mongo_ast[column_r], oporator_r, value_r);
            }
        
            return mongo_ast; 
        }

        
    }

    return null;
}

const ast_to_mongo = (ast) => {

    if(ast.hasOwnProperty('type')){
        if(ast.type == "binary_expr"){
            const {operator, left, right, parentheses } = ast;

            const _ast = ast_with_parentheses(ast);
            if(_ast != undefined && _ast != null) {                
                return _ast;
            }
            else {
                const ast_l = ast_to_mongo(left);
                const ast_r = ast_to_mongo(right);

                var mongo_ast = {};
                if(operator == "IN"){
                    mongo_ast[ast_l] = {};
                    mongo_ast[ast_l]['$'+operator.toLowerCase()] = ast_r;
                    return mongo_ast;
                }
                else if(operator == "NOT IN"){
                    mongo_ast[ast_l] = { $nin: ast_r };
                    return mongo_ast;
                }
                else if(operator == "="){
                    mongo_ast[ast_l] = { $eq: ast_r };
                    return mongo_ast;
                }
                else if(operator == "NOT"){
                    mongo_ast[ast_l] = { $not: ast_r };
                    return mongo_ast;
                }
                else if(operator == "OR" || operator == "NOR" || operator == "AND"){
                    mongo_ast['$'+operator.toLowerCase()] = [ast_l, ast_r];
                    return mongo_ast;
                }
                else if(operator == "<>"){
                    mongo_ast[ast_l] = { $ne: ast_r };
                    return mongo_ast;
                }
                else if(operator == ">"){
                    mongo_ast[ast_l] = { $gt: ast_r };
                    return mongo_ast;
                }
                else if(operator == ">="){
                    mongo_ast[ast_l] = { $gte: ast_r };
                    return mongo_ast;
                }
                else if(operator == "<"){
                    mongo_ast[ast_l] = { $lt: ast_r };
                    return mongo_ast;
                }
                else if(operator == "<="){
                    mongo_ast[ast_l] = { $lte: ast_r };
                    return mongo_ast;
                }
                else if(operator == "LIKE"){
                    mongo_ast[ast_l] = { $regex: `${ast_r}`, $options: 'i' };
                    return mongo_ast;
                }
                else if(operator == "NOT LIKE"){
                    mongo_ast[ast_l] = { $not: { $regex: `${ast_r}`, $options: 'i' } };
                    return mongo_ast;
                }
            }
        }
        else {
            if(ast.type == "column_ref"){
                const {table, column } = ast;
                return column/*.toLowerCase()*/;
            }
            else if(ast.type == "expr_list"){
                const { value } = ast;
                var list = [];
                value.forEach(function(obj){
                    if(obj.hasOwnProperty('value')){
                        list.push(obj.value);
                    }
                });
                return list;
            }
            else if (ast.type === 'number') {
                return parse_to_number(obj.value);
            } 
            else if (ast.type === 'string'){
                if(is_number(ast.value)) return parse_to_number(ast.value);
                if(validate_date(ast.value))return ast_date_fix(ast.value);
                return ast.value;
            }
            else if (ast.type === 'bool'){
                return obj.value;
                // value = value ? 'TRUE' : 'FALSE';
            }
            else if (ast.type === 'null'){
                return null;
                // value = 'NULL';
            }
            else if (ast.type === 'star'){
                // value = '*';
            }
            else if (['time', 'date', 'timestamp'].includes(ast.type)){
                return ast.value;
                // value = `${type.toUpperCase()} '${value}'`;
            }
            else if (ast.type === 'param'){
                // value = ':' + value;
            }
            else if (ast.type === 'interval') {
                
            }
        }
    }

};

module.exports = { validate_date, is_sql_injection, get_query_key, get_query_value, get_query, is_number, parse_to_number, ast_date_fix, ast_values, ast_column, ast_operator, ast_symbols, ast_with_parentheses, ast_to_mongo, triggers, model };