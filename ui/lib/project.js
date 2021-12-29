class Project
{
    constructor() {
        this.extensions = [];
        this.db = {};
        this.schemas = {}; 
    }

    get_id(){ throw new Error('get_id is not implemented'); };
    get_name(){ throw new Error('get_name is not implemented'); };
    get_location(){ throw new Error('get_location is not implemented'); };
    async get_tables(){ throw new Error('get_tables is not implemented'); };
    async get_table_schema(name){ throw new Error('get_table_schema is not implemented'); };
    async get_table_data(name, options){ throw new Error('get_table_data is not implemented'); };
    async get_permissions(){ throw new Error('get_permissions is not implemented'); };
    async get_roles(){ throw new Error('get_roles is not implemented'); };
    async get_role(id){ throw new Error('get_role is not implemented'); };
    async get_stats(name){ throw new Error('get_stats is not implemented'); };
    async get_connection(){ throw new Error('get_connection is not implemented'); };
    async get_extensions(){ throw new Error('get_extensions is not implemented'); };
    async initialize_extensions(app, env, project, apidoc, auth, view_engine){ throw new Error('initialize_extensions is not implemented'); };
    get_ports(){ throw new Error('get_ports is not implemented'); };
    get_jwt_expiry(){ throw new Error('get_jwt_expiry is not implemented'); };
    get_auth_settings(){ throw new Error('get_auth_settings is not implemented'); };
    async get_report(id){ throw new Error('get_report is not implemented'); }
};

module.exports = Project;