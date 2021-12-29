const path = require('path');

const use = (server) => {
    const { attach } = require(path.join(server.ui_path +'/routes/views'));

    server.app.post(`/api/${server.project.get_id()}/restart`, async (req, res) => {
        res.redirect(`/project/load/${server.project.get_id()}`);
        process.exit();
    });
    
    attach(server);
    //attach(server.app, server.project, server.apidoc);
};

module.exports = {use};