const fs = require("fs");
const path = require('path');
const mssql = require('mssql');
const mongoose = require("mongoose");

class Database{
    #server;

    constructor(server) {
        this.#server = server;
    }

    async #onconnected(){
        const server = this.#server;
        const logger = server.logger;
        const DB_DRIVER = server.config.database.driver;
        const Project = require(path.join(server.ui_path +'/lib/project'));
        const mongo_helper = require(path.join(server.ui_path +'/lib/mongo_helper'));
        const { create_element, create_report_templates } = require(path.join(server.ui_path +'/routes/views'));
        
        
        Project.prototype.get_id = function(){
            return server.config.id;                
        };
        Project.prototype.get_name = function(){
            return server.config.name;                
        };
        Project.prototype.get_location = function(){
            return server.config.location;                
        };
        Project.prototype.get_auth_settings = function(){
            return {
                DisableSignup:false,
                EmailAuth:{
                 Enabled:true,
                 EnableEmailSignup : true,
                 EnableEmailconfirmations : true,
                 EnableCustomSMTP : false
               },
               PhoneAuth:{
                 Enabled:false,
                 EnablePhoneSignup : false,
                 EnablePhoneConfirmations : false
               },
               ExternalOAuthProviders:{
                 Enabled:false,
                 AppleEnabled : false,
                 AzureEnabled : false,
                 BitbucketEnabled : false,
                 DiscordEnabled : false,
                 FacebookEnabled : false,
                 GitHubEnabled : false,
                 GitLabEnabled : false,
                 GoogleEnabled : false,
                 TwitchEnabled : false,
                 TwitterEnabled : false
               }
             };                 
        };
        Project.prototype.get_extensions = async function(){
            const extensions_path = path.join(server.root_path + `/src/plugins/`);
            if(fs.existsSync(extensions_path)){
                const getDirectories = source =>
                    fs.readdirSync(source, { withFileTypes: true })
                      .filter(dirent => dirent.isDirectory())
                      .map(dirent => dirent.name)
      
                const dirs = getDirectories(extensions_path);
                
                dirs.forEach((dir)=>{
                    const p = path.join(extensions_path+dir+"/plugin.js");
                    if (fs.existsSync(p)) {
                        const plugin = require(p);
                        if(!server.extensions.some(e=>e.get_id() == plugin.get_id()))
                            server.extensions.push(plugin);
                    }
                });
            }
            
            return server.extensions;
        };
        Project.prototype.initialize_extensions = async function(server, authentication, views){
          const extensions = await this.get_extensions();
          extensions.forEach(async(extension)=>{
            if(extension.hasOwnProperty('initialize')){
                const init = await extension.initialize(server, authentication, views);
                if(!init){
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "PLUGIN".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `Failed to initialize : ${extension.hasOwnProperty('get_name')} [${extension.hasOwnProperty('get_id')}] `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
            }        
          });
        };
        Project.prototype.get_ports = function(){
            return {
              HTTP_PORT : server.config.server.port, 
              HTTPS_PORT : server.config.server.secure.port
            };                
        };
        Project.prototype.get_jwt_expiry = function(){
            return server.config.authentication.time;                
        };
        Project.prototype.get_report = async function(){
    
            const report_templates = [];
    
            const extensions = await this.get_extensions();
            extensions.forEach((extension)=>{
                if(extension.hasOwnProperty('get_activated')){
                    if(extension.get_activated()){
                        if(extension.hasOwnProperty('get_report_templates')){
                            extension.get_report_templates().forEach((template)=>{
                                report_templates.push(template);
                            });
                        }
                    }
                }
            });
      
            const views = create_report_templates(report_templates);
      
            const content = [
                create_element( "div", { "class":"p-4 w-full" },[
                    create_element( "div", { "class":"my-8 space-y-8" },[
                        create_element( "div", null,[
                            create_element( "ul", { 
                                "class":"grid grid-cols-1 gap-4 mx-auto w-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }, 
                                views
                            )
                        ]) 
                    ])
                ])
            ];
        
            return content; 
        };
        
        if(DB_DRIVER == "mssql"){
            Project.prototype.get_tables = async function(){
                try {
                    const DB_DATA = server.config.database.data_db; 
                    const DB_DICT = server.config.database.dictionary_db; 
                    
                    let sql  = `SELECT`;
                        sql += ` [TABLE_NAME]`;
                        sql += ` FROM ${DB_DATA}.INFORMATION_SCHEMA.TABLES`;
                        sql += ` WHERE [TABLE_TYPE] = 'BASE TABLE'`;
                        sql += ` ORDER BY [TABLE_NAME]`;
                        
                    const pool = await mssql.connect(url);
                    const data_results = await pool.query(sql);
                    
                    const data_tables = data_results.recordset.map(record => { return `${DB_DATA}.dbo.${record.TABLE_NAME}`; });
                   
                    sql  = `SELECT`;
                    sql += ` [TABLE_NAME]`;
                    sql += ` FROM ${DB_DICT}.INFORMATION_SCHEMA.TABLES`;
                    sql += ` WHERE [TABLE_TYPE] = 'BASE TABLE'`;
                    sql += ` ORDER BY [TABLE_NAME]`;
                   
                    const dict_results = await pool.query(sql);
                    const dict_tables = dict_results.recordset.map(record => { return `${DB_DICT}.dbo.${record.TABLE_NAME}`; });
                  
                    pool.close();
                    return [...data_tables,...dict_tables];
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[32m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
                return [];
            }
            Project.prototype.get_table_schema = async function(name){
                try {
                    const db = name.substring(0, name.indexOf('.'));
                    const table = name.substring(name.lastIndexOf('.')+1);
                 
                    let sql  = `SELECT`;
                        sql += ` [COLUMN_NAME]`;
                        sql += ` ,[DATA_TYPE]`;
                        sql += ` FROM ${db}.INFORMATION_SCHEMA.COLUMNS`;
                        sql += ` WHERE [TABLE_NAME] = @table_name`;
                        //sql += ` ORDER BY [COLUMN_NAME]`;
        
                    const pool = await mssql.connect(url);
                    const result = await pool.request()
                                             .input('table_name', mssql.NVarChar(table.length), table)
                                             .query(sql)
                    pool.close();
                    return result.recordset.map(record => { 
                        return { 
                            name:record.COLUMN_NAME, 
                            data_type:record.DATA_TYPE 
                        }; 
                    });
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
                return [];
            }
            Project.prototype.get_table_data = async function(name, options){
                try {
                    const { limit, page, query, sort, select } = options;
        
                    var where = null;
                    if(query != undefined && query != null){
                        const constructURL = new URL(`http://fake.url.needed?${query}`);
                        where = mongo_helper.get_query(constructURL, DB_DRIVER);
                    }
                    
        
                    let sql  = `SELECT`;
                        sql += ` *`;
                        sql += ` FROM ${name}`;
                        if(where != null)sql += ` WHERE ${where}`;
                        sql += ` ORDER BY (SELECT NULL)`;
                        sql += ` OFFSET ${limit * (page-1)} ROWS`;
                        sql += ` FETCH NEXT ${limit} ROWS ONLY`;
        
                    let pool = await mssql.connect(url);
                    let result = await pool.request().query(sql);
        
                    const db = name.substring(0, name.indexOf('.'));
                    const table = name.substring(name.lastIndexOf('.')+1);
        
                    sql  = `SELECT`;
                    sql += ` COUNT(1) as "Total" `;
                    sql += ` FROM ${name}`;
                    if(where != null)sql += ` WHERE ${where}`;
                    sql += ` ORDER BY (SELECT NULL)`;
                   
                    let _result = await pool.request().query(sql);
                    pool.close();
                    
                    let count = 0;
                    let pages = 0;
                    if(_result != null && _result.recordset.length > 0){
                        count = _result.recordset[0].Total;
                        pages = Math.ceil(count/limit);
                    }
                    return {data:result.recordset, count, pages};
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
                return {data:[], count:0, pages:0};
            }
            Project.prototype.get_permissions = async function(){
                try {
                    const DB_DICT = server.config.database.dictionary_db; 
                    
                    let sql  = `SELECT [Name] as "name" ,[Id] as "_id", [Title] as "title" `;
                        sql += `FROM [${DB_DICT}].[dbo].[Permissions] `;
        
                    const pool = await mssql.connect(url);
                    const result = await pool.request()
                                            .query(sql)
                    pool.close();
                    return result.recordset;
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
                return [];
            }
            Project.prototype.get_roles = async function(){
                try {
                    const DB_DICT = server.config.database.dictionary_db; 
                    
                    let sql  = `SELECT [Name] as "name" ,[Id] as "_id", [Title] as "title", `;
                        sql += `(SELECT count([Id]) FROM [${DB_DICT}].[dbo].[UserRoles] where [RoleID] = "role".[Id]) as "users" `;
                        sql += `FROM [${DB_DICT}].[dbo].[Roles] "role" `;
        
                    const pool = await mssql.connect(url);
                    const result = await pool.request()
                                            .query(sql)
                    pool.close();
                    return result.recordset;
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `Roles Error `, "\x1b[0m");
                        logger.write(console_text);
                }
                return [];
            }
            Project.prototype.get_role = async function(id){
                try {
                    const DB_DICT = server.config.database.dictionary_db; 
                    
                    let sql  = `SELECT [Name] as "name" ,[Id] as "_id", [Title] as "title" `;
                        sql += ` FROM [${DB_DICT}].[dbo].[Roles] "role" `;
                        sql += ` WHERE [Id]=@roleid`;
                       
                    const pool = await mssql.connect(url);
                    const result = await pool.request()                                        
                                            .input('roleid', mssql.Int, parseInt(id))
                                            .query(sql);
        
                    sql  = `SELECT "perm".[Name] as "name" ,"perm".[Id] as "_id", "perm".[Title] as "title" `;
                    sql += `FROM [${DB_DICT}].[dbo].[Permissions] "perm" `;
                    sql += `INNER JOIN [${DB_DICT}].[dbo].[RolePermissions] "rp" `;
                    sql += `ON "perm".[Id] = "rp".[PermissionID] `;
                    sql += `WHERE "rp".[RoleID]= @roleid`;
        
                    const role = result.recordset.shift();
                    role.permissions = (await pool.request()                                        
                                            .input('roleid', mssql.Int, parseInt(id))
                                            .query(sql)).recordset;
                    
                    pool.close();
                    return role;
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
                return null;
            }
            Project.prototype.get_stats = async function(name){
                try {            
                    const db = name.substring(0, name.indexOf('.'));
                    const table = name.substring(name.lastIndexOf('.')+1);
                    
                    let sql  = `USE ${db}; `;
                        sql += `IF OBJECT_ID('tempdb..#SpaceUsed') IS NOT NULL `;
                        sql += `	DROP TABLE #SpaceUsed `;
                        sql += ` `;
                        sql += `CREATE TABLE #SpaceUsed ( `;
                        sql += `	 TableName sysname `;
                        sql += `	,NumRows BIGINT `;
                        sql += `	,ReservedSpace VARCHAR(50) `;
                        sql += `	,DataSpace VARCHAR(50) `;
                        sql += `	,IndexSize VARCHAR(50) `;
                        sql += `	,UnusedSpace VARCHAR(50) `;
                        sql += `	)  `;
                        sql += ` `;
                        sql += `DECLARE @str VARCHAR(500) `;
                        sql += `SET @str =  'exec sp_spaceused ''?''' `;
                        sql += `INSERT INTO #SpaceUsed  `;
                        sql += `EXEC sp_msforeachtable @command1=@str `;
                        sql += ` `;
                        sql += `SELECT TableName, NumRows,  `;
                        sql += `CONVERT(numeric(18,0),REPLACE(ReservedSpace,' KB','')) * 1024 as ReservedSpace, `;
                        sql += `CONVERT(numeric(18,0),REPLACE(DataSpace,' KB','')) * 1024 as DataSpace, `;
                        sql += `CONVERT(numeric(18,0),REPLACE(IndexSize,' KB','')) * 1024 as IndexSpace, `;
                        sql += `CONVERT(numeric(18,0),REPLACE(UnusedSpace,' KB','')) * 1024 as UnusedSpace `;
                        sql += `FROM #SpaceUsed `;
                        sql += `WHERE TableName = '${table}' `;
                        sql += `ORDER BY ReservedSpace desc `;
                   
                    let pool = await mssql.connect(url);
                    let _result = await pool.request().query(sql);
                    pool.close();
        
                    var count = '?';
                    var size = '?';
        
                    if(_result != null && _result.recordset.length > 0){
                        count = _result.recordset[0].NumRows;
                        size = _result.recordset[0].DataSpace;
                    }
                    
                    return {name, count, size};
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
                return [];
            }
            Project.prototype.get_connection = async function() {
                try {
                    const DB_DATA = server.config.database.data_db; 
                    const DB_DICT = server.config.database.dictionary_db; 
                    
                    const pool = await mssql.connect(url);
                    const config = { 
                        port:pool.config.port, 
                        name:`${DB_DATA} / ${DB_DICT}`/*pool.config.database*/, 
                        host:pool.config.server,
                        username:pool.config.user, 
                        password:pool.config.password
                    };
                    pool.close();
                    return config;
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[31m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
                return null; 
            };

            const create_dbs  = async (url) => {
                try {
                    const DB_DATA = server.config.database.data_db; 
                    const DB_DICT = server.config.database.dictionary_db; 

                    let sql  = `SELECT`;
                        sql += ` [name]`;
                        sql += ` FROM master.dbo.sysdatabases`;
                        sql += ` WHERE LOWER([name]) IN ('${DB_DATA}','${DB_DICT}')`;
            
                    const pool = await mssql.connect(url);
                    const result = await pool.query(sql);
                    
                    const dbs = result.recordset.map(record => { return record.name; });
                    if(dbs.length != 2){
                        if(!dbs.includes(DB_DATA)){
                            try {
                                const file = DB_DATA;
                                const sqlfile = require(path.join(server.root_path +`/src/data/db/models/mssql/${file}.sql`));
                                if (fs.existsSync(sqlfile)) { 
                                    sql = fs.readFileSync(sqlfile).toString().replace(/{{dbname}}/g,`${file}`);
            
                                    await pool.query(`create database ${file}`);
                                    await pool.query(sql);
                                }
                            } catch(err) {
                                const timestamp = logger.get_timestamp();
                                var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                                    console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                                    console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                                    console_text += logger.console_color("\x1b[32m", `Error `, "\x1b[0m");
                                    logger.write(console_text);
                            }
                        }
            
                        if(!dbs.includes(DB_DICT)){
                            try {
                                const file = DB_DICT;
                                const sqlfile = require(path.join(server.root_path +`/src/data/db/models/mssql/${file}.sql`));
                                if (fs.existsSync(sqlfile)) { 
                                    sql = fs.readFileSync(sqlfile).toString().replace(/{{dbname}}/g,`${file}`);
            
                                    await pool.query(`create database ${file}`);
                                    await pool.query(sql);
                                }
                            } catch(err) {
                                const timestamp = logger.get_timestamp();
                                var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                                    console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                                    console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                                    console_text += logger.console_color("\x1b[32m", `Error `, "\x1b[0m");
                                    logger.write(console_text);
                            }
                        }
                    }
                    pool.close();
            
                    return dbs.map(db => { return {db:db, db_type:db.includes(DB_DATA) ? "data" : "dictionary" }; });
                } catch (err) {
                    const timestamp = logger.get_timestamp();
                    var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[33m", "MSSQL".padEnd(7), "\x1b[0m");
                        console_text += logger.console_color("\x1b[37m", `${err.message} `, "\x1b[0m");
                        console_text += logger.console_color("\x1b[32m", `Error `, "\x1b[0m");
                        logger.write(console_text);
                }
            
                return [];
            };

            const url = server.config.database.connection_string;
            const dbs = await create_dbs(url);
        }
        else if(DB_DRIVER == "mongodb"){
            const Data_LabRequest = mongo_helper.model("/src/data/db/mongodb/data_requests.js", server.root_path, mongoose);
            const Data_LabResult = mongo_helper.model("/src/data/db/mongodb/data_lab_results.js", server.root_path, mongoose);
            const Data_Monitoring = mongo_helper.model("/src/data/db/mongodb/data_monitorings.js", server.root_path, mongoose);

            const Dict_Permission = mongo_helper.model("/src/data/db/mongodb/dictionary_permissions.js", server.root_path, mongoose);
            const Dict_Role = mongo_helper.model("/src/data/db/mongodb/dictionary_roles.js", server.root_path, mongoose);
            const Dict_User = mongo_helper.model("/src/data/db/mongodb/dictionary_users.js", server.root_path, mongoose);
            
            Project.prototype.get_tables = async function(){
                const cols = await mongoose.connection.db.listCollections().toArray();
                    cols.sort(function(a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });
            
                return cols.map(function(col) { return col.name });
            };
            Project.prototype.get_table_schema = async function(name){
                const details = [];
                const _schema = mongoose.model(name).schema.paths;
                
                for(const key in _schema){
                   
                    const { path, instance } = _schema[key];
            
                    if(path == '_id' && instance == 'ObjectID'){ }
                    else if(path == '__v' && instance == 'Number'){ }
                    else {
                    details.push({
                        name:path,
                        data_type:instance
                    });
                    }
                }
            
                details.sort(function(a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });
            
                return details;
            };
            Project.prototype.get_table_data = async function(name, options){
                const { limit, page, query, sort, select } = options;
            
                var mongo_query = {};
                if(query != undefined && query != null){
                    const constructURL = new URL(`http://fake.url.needed?${query}`);
                    const where = mongo_helper.get_query(constructURL, DB_DRIVER);
                    
                    const parse_result = new Parser().parse(`SELECT * FROM t where ${where}`);
                    mongo_query = mongo_helper.ast_to_mongo(parse_result.where);
                }
                
                const _model = mongoose.model(name);
                const data = await _model.find(mongo_query)
                                                .select(select)
                                                .limit(limit)
                                                .skip(limit * (page-1))
                                                .sort(sort);
                const count = await _model.countDocuments(mongo_query);
                const pages = Math.ceil(count/limit);
            
                return {data, count, pages}
            };
            Project.prototype.get_permissions = async function(){
                return await Dict_Permission.find();
            };
            Project.prototype.get_roles = async function(){
                return await Dict_Role.find().populate('users');
            };
            Project.prototype.get_role = async function(id){
                return await Dict_Role.findOne({_id:mongoose.Types.ObjectId(id)})
                .populate('permissions');
            };
            Project.prototype.get_stats = async function(name){
                const _model = mongoose.model(name);
                const stats = await _model.collection.stats();
                const count = stats.count;
                const size = stats.size;
            
                return {name, count, size};
            };
            Project.prototype.get_connection = async function() {
                const { port, name, host } = mongoose.connection;
                return { port, name, host, username:"", password:"" };
            };

            
            const create_permission  = async (data) => {
                if (Dict_Permission == undefined || Dict_Permission == null)  return null;
              
                let _permission = await Dict_Permission.findOne({ name: data.name });
                if (_permission != undefined && _permission != null) return _permission;
              
                const timestamp = logger.get_timestamp();
                var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[33m", "INIT".padEnd(7), "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `Permission: '${data.name}' `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", `Created `, "\x1b[0m");
                    logger.write(console_text);
              
                return await Dict_Permission.create(data);
            };
              
            const create_role  = async (data) => {
                if (Dict_Role == undefined || Dict_Role == null) return null;
              
                let _role = await Dict_Role.findOne({ name: data.name });
                if (_role != undefined && _role != null) return _role;
              
                const timestamp = logger.get_timestamp();
                var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[33m", "INIT".padEnd(7), "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `Role: '${data.name}' `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", `Created `, "\x1b[0m");
                    logger.write(console_text);
                return await Dict_Role.create(data);
            };

            const superuser_permission = await create_permission({ name: 'Super user', title: null });
            const login_permission = await create_permission({ name: 'User can login',title: null });
            const db_creator_permission = await create_permission({ name: 'User can create databases',title: null });
            const replication_and_backup_permission = await create_permission({ name: 'User can initiate streaming replication and put the system in and out of backup mode',title: null });
            const bypass_security_permission = await create_permission({ name: 'User bypasses every row level security policy',title: null });

            const anonymous_role = await create_role({ name: 'anonymous', title: null, permissions:[], users:[] });
            const authenticated_role = await create_role({ name: 'authenticated', title: null, permissions:[], users:[] });
            const authenticator_role = await create_role({ name: 'authenticator', title: null, permissions:[ login_permission._id ], users:[] });
            const dashboard_user_role = await create_role({ name: 'dashboard_user', title: null, permissions:[ db_creator_permission._id, replication_and_backup_permission._id ], users:[] });
            const service_role_role = await create_role({ name: 'service_role', title: null, permissions:[ bypass_security_permission._id ], users:[] });
            const dbadmin_role = await create_role({ name: 'database_admin', title: null, permissions:[ login_permission._id, db_creator_permission._id, replication_and_backup_permission._id, bypass_security_permission._id ], users:[] });
            const su_role = await create_role({ name: 'superuser', title: null, permissions:[ superuser_permission._id, login_permission._id, db_creator_permission._id, replication_and_backup_permission._id, bypass_security_permission._id ], users:[] });
        }

        return new Project();
    }

    async connect(){
        const server = this.#server;
        const DB_DRIVER = server.config.database.driver;
        const logger = server.logger;

        try {
            if(DB_DRIVER == "mssql"){
                return await this.#onconnected();
            }
            else if(DB_DRIVER == "mongodb"){
                const url = server.config.database.connection_string;

                await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
            
                const timestamp = logger.get_timestamp();
                var console_text  = logger.console_color("\x1b[36m", `${timestamp} `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[33m", `MONGO `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[37m", `Connected to database `, "\x1b[0m");
                    console_text += logger.console_color("\x1b[32m", `Successfully `, "\x1b[0m");
                    //logger.write(console_text);
                    process.stdout.write(console_text);
                    
                return await this.#onconnected();
            }
        } catch (err) {
            console.log('Failed to connect to MongoDB', err);
            process.exit(1);
        }
    }
}

module.exports = Database;