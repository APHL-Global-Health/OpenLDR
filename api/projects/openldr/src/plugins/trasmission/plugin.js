const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const xml2js = require('xml2js'); 
const mongoose = require("mongoose");
const swagger_jsdoc = require('swagger-jsdoc');

//ui library
var app = null;
var auth = null;
var project = null;
var mongo_helper = null;
var Parser = null;

var DB_DRIVER = null;
var DB_URI = null;
var DB_DATA = null;
var DB_DICT = null;


const toJson = (status, data) => {
    return {
        Status : status,
        Data : data
    }
};

const toXML = (status, data) => {
    // const json_string = JSON.stringify({
    //     Status : status,
    //     Data : { Item:data }
    // })
    // .replace(/\\u0006/g, "");
    const json_string = JSON.stringify(toJson(status, data))
                            .replace(/\\u0006/g, "");
                            //.replace(/[\\u0000-\\u0008\\u000A-\\u001F\\u0100-\\uFFFF]/mg, "");
   
    const builder = new xml2js.Builder({
        headless: true,
        allowSurrogateChars: true,
        rootName: 'Xml',
        cdata: true
       });
    return builder.buildObject(JSON.parse(json_string));
};

const transmission_report_template = (item, start_date, end_date) => {
    const get_system = (item) =>{
        var _system = item.RequestID.substring(0, 6);	
        if(_system == "TZDISA")return 'Disa*Lab';
        else if(_system == "TZNACP")return 'EVLIMS';
        else if(_system == "TZSKYL")return 'SkyLIMS';
        
        _system = item.RequestID.substring(0, 9);
        if(_system == "TZLABMATE")return 'LabMate';
        
        _system = item.RequestID.substring(0, 5);
        if(_system == "TZSTS")return 'eSRS';
        
        _system = item.RequestID.substring(0, 7);
        if(_system == "TZJEEVA")return 'Jeeva';
        
        return "Unknown"
    };
    
    const get_testing_lab = (item) =>{
        var _lab = item.RequestID.substring(0, 9).slice(-3);	
        if(['TZA','TZC','TZH'].includes(_lab)) return 'Mnazi Mmoja';
        else if(['TDS','TEQ'].includes(_lab)) return 'NHL-QATC';
        else if(['TMS','TMC','TMH'].includes(_lab)) return 'Kilimanjaro Christian Medical Centre';
        else if(['TBA','TBC','TBG'].includes(_lab)) return 'Bugando Medical Centre';
        else if(['TMA','TMB','TMG'].includes(_lab)) return 'Mbeya Zonal Referral Hospital';
        
        _lab = item.RequestID.substring(0, 10);	
        if(_lab.includes('TZNACP-IRI') || item.RequestID == 'iringarrh') return 'Iringa Referral Hospital';
        else if(_lab.includes('TZNACP-MTR') || item.RequestID == 'ligularrh') return 'Ligula Hospital';
        else if(_lab.includes('TZNACP-DOD') || item.RequestID == 'dodoma') return 'Dodoma Regional Referral Hospital';
        else if(_lab.includes('TZNACP-SNG')) return 'Singida Region Referral';
        else if(_lab.includes('TZNACP-TBR')) return 'Kitete Regional Referral Hospital';
        else if(_lab.includes('TZNACP-STF')) return 'St. Francis Designated District Hospital';		
        else if(['TZNACP-STE','TZNACP-STS'].includes(_lab)) return 'Iringa Dream Molecular Laboratory';
        else if(['TZNACP-MTM', 'TZNACP-MMT'].includes(_lab) || item.RequestID == 'mtmerurrh') return 'Mt. Meru';
        else if(['TZNACP-MOR', 'TZNACP-MRO'].includes(_lab) || item.RequestID == 'morogoro') return 'Morogoro Regional Referral Hospital';
        
        _lab = item.RequestID.substring(0, 9);	
        if(_lab == 'TZLABMATE') return 'MDH - Temeke';
        
        _lab = item.RequestID.substring(0, 11);	
        if(_lab == 'TZSKYLNDAND') return 'Ndanda Regional Referral Hospital';
        
        _lab = item.RequestID.substring(0, 7);	
        if(_lab == 'TZJEEVA' && item.LIMSFacilityCode == "TZMNH#JEEVA") return 'Muhimbili Referral Hospital at National Level';
        
        return "Unknown"
    };
    
    const get_date = (item, date_type) =>{
        if(item.RegisteredDateTime != undefined && item.RegisteredDateTime != null){
            const dt = new Date(item.RegisteredDateTime);
            if(dt >= start_date && dt <= end_date){
                    if(date_type == "date")return dt.getDate();
                    else if(date_type == "month")return dt.getMonth()+1;
                    else if(date_type == "year")return dt.getFullYear();
            }
        }
        
        if(item.AnalysisDateTime != undefined && item.AnalysisDateTime != null){
            const dt = new Date(item.AnalysisDateTime);
            if(dt >= start_date && dt <= end_date){
                    if(date_type == "date")return dt.getDate();
                    else if(date_type == "month")return dt.getMonth()+1;
                    else if(date_type == "year")return dt.getFullYear();
            }
        }
        
        if(item.AuthorisedDateTime != undefined && item.AuthorisedDateTime != null){
            const dt = new Date(item.AuthorisedDateTime);
            if(dt >= start_date && dt <= end_date){
                    if(date_type == "date")return dt.getDate();
                    else if(date_type == "month")return dt.getMonth()+1;
                    else if(date_type == "year")return dt.getFullYear();
            }
        }
        
        return 0;
    };
    
    const date_counter = (date_field) =>{
        if(date_field != undefined && date_field != null){
            const dt = new Date(date_field);
            if(dt >= start_date && dt <= end_date) return 1;
        }
        return 0;
    };
    
    const counter_tested_workload = (item) =>{
        if(item.AnalysisDateTime != undefined && item.AnalysisDateTime != null &&
            item.RegisteredDateTime != undefined && item.RegisteredDateTime != null){
            const dt_registered = new Date(item.RegisteredDateTime);
            const dt_tested = new Date(item.AnalysisDateTime);
            if((dt_registered >= start_date && dt_registered <= end_date) && 
                (dt_tested >= start_date && dt_tested <= end_date)) return 1;
        }
        return 0;
    };
    
    const counter_authorized_workload = (item) =>{
        if(item.AnalysisDateTime != undefined && item.AnalysisDateTime != null &&
            item.RegisteredDateTime != undefined && item.RegisteredDateTime != null &&
            item.AuthorisedDateTime != undefined && item.AuthorisedDateTime != null){
            const dt_registered = new Date(item.RegisteredDateTime);
            const dt_tested = new Date(item.AnalysisDateTime);
            const dt_authorized = new Date(item.AuthorisedDateTime);
            if((dt_registered >= start_date && dt_registered <= end_date) && 
                (dt_tested >= start_date && dt_tested <= end_date) &&
                (dt_authorized >= start_date && dt_authorized <= end_date)) return 1;
        }
        return 0;
    };
    
    const rejection_counter = (item) =>{
        return (item.LIMSRejectionCode != undefined && 
        item.LIMSRejectionCode != null && 
        item.LIMSRejectionCode.trim().length != 0) ? 1 : 0;
    };
    
    
    return {
        "Test":item.LIMSPanelCode,
        "System":get_system(item),
        "TestingLab":get_testing_lab(item),
        "Date":get_date(item, "date"),
        "Month":get_date(item, "month"),
        "Year":get_date(item, "year"),
        "Received":date_counter(item.ReceivedDateTime),
        "Registered":date_counter(item.RegisteredDateTime),
        "Tested":date_counter(item.AnalysisDateTime),
        "Authorised":date_counter(item.AuthorisedDateTime),
        "Rejected":rejection_counter(item),
        "Tested_Workload":counter_tested_workload(item),
        "Authorised_Workload":counter_authorized_workload(item)
    }
};

const groupAndSum = (arr, groupKeys, sumKeys) => {
    return Object.values(
    arr.reduce((acc,curr)=>{
        const group = groupKeys.map(k => curr[k]).join('-');
        acc[group] = acc[group] || Object.fromEntries(groupKeys.map(k => [k, curr[k]]).concat(sumKeys.map(k => [k, 0])));
        sumKeys.forEach(k => acc[group][k] += curr[k]);
        return acc;
    }, {})
    );
};



const get_id = () =>{
    const config = get_config();
    return config.id;
};

const get_name = () =>{
    const config = get_config();
    return config.name;
};

const get_description = () =>{
    const config = get_config();
    return config.description;
};

const get_activated = () =>{
    const config = get_config();
    return config.activate;
};

const set_activated = (activate) =>{
    const config = get_config();
    config.activate = activate;
    save_config(config);
};

const get_schema = () =>{
    const config = get_config();
    return config.schema;
};

const get_config = () =>{
    const config_path = path.join(__dirname + `/config.json`);            
    return JSON.parse(fs.readFileSync(config_path, 'utf8'));
};

const save_config = (config) =>{
    const config_path = path.join(__dirname + `/config.json`); 
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(config_path, data);
};

const initialize = (server, authentication, views) =>{
    app = server.app;
    auth = authentication;
    project = server.project;

    mongo_helper = server.libraries.mongo_helper;
    Parser = server.libraries.Parser;

    DB_DRIVER = server.config.database.driver;
    DB_URI = server.config.database.connection_string;
    DB_DATA = server.config.database.data_db;
    DB_DICT = server.config.database.dictionary_db;

    const { create_element, report, functionify } = views;

    const extension_apidoc_options = {
        swaggerDefinition:{
            openapi: "3.0.0",
            info: { title: 'OpenLDR Transmission Tool', version: '1.0.0', description: 'Open Laboratory Data Repository Transmission Reporting Tool'},
            basePath: '/'
        },
        apis: ["./routes/*.js"],
    };
    const extension_apidoc = swagger_jsdoc(extension_apidoc_options);
    app.get('/api/openldr/transmission/apidoc', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(extension_apidoc);
    });

    app.get("/api/openldr/transmission/:version/:returntype/:year/:month/:testcode", auth, async (req, res) => {
        const version = req.params.version;
        const returntype = req.params.returntype;
        const year = req.params.year;
        const month = req.params.month;
        const testcode = req.params.testcode;

        const returntypes = ["json","xml"];
        const accepted_test_codes = ["HIVVL","HIVPC"];
        
        if(get_activated()){
            if(version.toLowerCase() == "v1"){
                if(returntypes.includes(returntype.toLowerCase())){
                    if(accepted_test_codes.includes(testcode.toUpperCase())){
                        if((/^(19[0-9]{2}|[2-9][0-9]{3})$/gi).test(year)){
                            if((/^([1-9]|0[1-9]|1[0-2])$/gi).test(month)){		
                                try{                    
                                    var list = [];
                                    
                                    if(DB_DRIVER == "mongodb"){
                                        const days_in_month = new Date(parseInt(year), parseInt(month), 0).getDate();
                                        const start_datetime = `${year}-${month}-01 00:00:00`;
                                        const end_datetime = `${year}-${month}-${days_in_month} 23:59:59`;

                                        var search = `RegisteredDateTime.parentheses.open=ge.${start_datetime}|an_le.${end_datetime}`;
                                            search += `&AnalysisDateTime.or=ge.${start_datetime}|an_le.${end_datetime}`;
                                            search += `&AuthorisedDateTime.parentheses.close.or=ge.${start_datetime}|an_le.${end_datetime}`;
                                            search += `&LIMSPanelCode.and=eq.${testcode}`;
                                            //search += `&LIMSPanelCode.and=in.'HIVVL','HIVPC'`;
                                         
                                        const constructURL = new URL(`${req.protocol}://${req.get('host')}?${search}`);
                                        
                                        const query = mongo_helper.get_query(constructURL, DB_DRIVER);                                       
                                        const parse_result = new Parser().parse(`SELECT * FROM t where ${query}`);
                                        const mongo_query = mongo_helper.ast_to_mongo(parse_result.where);

                                        const _model = mongoose.model(`${DB_DATA}_requests`);
                                        const _list = await _model.find(mongo_query,{'_id': 0});

                                        const  start_date = new Date(start_datetime);
                                        const end_date = new Date(end_datetime);

                                        const templates = _list.map((item) => {
                                            return transmission_report_template(item, start_date, end_date);
                                        });

                                        list = groupAndSum(templates, 
                                            ['System', 'Test', 'TestingLab', 'Date', 'Month', 'Year'], 
                                            ['Received', 'Registered', 'Tested', 'Authorised', 'Rejected', 'Tested_Workload','Authorised_Workload']
                                        );
                                    }
                                    else if(DB_DRIVER == "mssql"){

                                        var _month = parseInt(month);
                                        var _year = parseInt(year);
                                        if (_month + 1 > 12)
                                        {
                                            _month = 0;
                                            _year += 1;
                                        }

                                        var sql = "";
                                        sql += "declare @StartDate nvarchar(max) = '" + year + "-" + (month < 10 ?  "0"+month : month) + "-01'; ";
                                        sql += "declare @EndDate nvarchar(max)   = '" + _year + "-" + (_month + 1 < 10 ? "0"+(_month + 1) : (_month + 1)) + "-01'; ";
                                        sql += "";
                                        sql += "SELECT ";
                                        sql += "	[LIMSPanelCode] as \"Test\", ";
                                        sql += "	(CASE WHEN LEFT([RequestID],6) = 'TZDISA'    THEN 'Disa*Lab' ";
                                        sql += "		  WHEN LEFT([RequestID],6) = 'TZNACP'    THEN 'EVLIMS'  ";
                                        sql += "		  WHEN LEFT([RequestID],9) = 'TZLABMATE' THEN 'LabMate' ";
                                        sql += "		  WHEN LEFT([RequestID],6) = 'TZSKYL'    THEN 'SkyLIMS' ";
                                        sql += "		  WHEN LEFT([RequestID],5) = 'TZSTS'     THEN 'eSRS' ";
                                        sql += "		  WHEN LEFT([RequestID],7) = 'TZJEEVA'   THEN 'Jeeva' ";
                                        sql += "		  ELSE 'Unknown' END) as \"System\"  ";
                                        sql += "";
                                        sql += "	,(CASE WHEN RIGHT(LEFT([RequestID],9),3) IN ('TZA','TZC','TZH')									THEN 'Mnazi Mmoja' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TDS','TEQ')										THEN 'NHL-QATC' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TMS','TMC','TMH')									THEN 'Kilimanjaro Christian Medical Centre' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TBA','TBC','TBG')									THEN 'Bugando Medical Centre' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TMA','TMB','TMG')									THEN 'Mbeya Zonal Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-IRI' OR [RequestID] = 'iringarrh'					THEN 'Iringa Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-MTR' OR [RequestID] = 'ligularrh'					THEN 'Ligula Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-DOD' OR [RequestID] = 'dodoma'						THEN 'Dodoma Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-SNG'													THEN 'Singida Region Referral' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-TBR'													THEN 'Kitete Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-STF'													THEN 'St. Francis Designated District Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-STE','TZNACP-STS')									THEN 'Iringa Dream Molecular Laboratory' "; // --109580-1
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-MTM', 'TZNACP-MMT') OR [RequestID] = 'mtmerurrh'	THEN 'Mt. Meru' ";
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-MOR', 'TZNACP-MRO') OR [RequestID] = 'morogoro'	THEN 'Morogoro Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],9)  = 'TZLABMATE'													THEN 'MDH - Temeke' ";
                                        sql += "		   WHEN LEFT([RequestID],11) = 'TZSKYLNDAND'												THEN 'Ndanda Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],7)  = 'TZJEEVA' AND [LIMSFacilityCode] = 'TZMNH#JEEVA'				THEN 'Muhimbili Referral Hospital at National Level' ";
                                        sql += "		   ELSE 'Unknown : '+[RequestID] END) as \"TestingLab\"  ";
                                        sql += "   ,(CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(day,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(day,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(day,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) as \"Date\" ";
                                        sql += "   ,(CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(month,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(month,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(month,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) as \"Month\" ";
                                        sql += "   ,(CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(year,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(year,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(year,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) as \"Year\" ";
                                        sql += "	,SUM(CASE WHEN [ReceivedDateTime]   >= @StartDate AND [ReceivedDateTime]   < @EndDate THEN 1 ELSE 0 END) as \"Received\" ";
                                        sql += "	,SUM(CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN 1 ELSE 0 END) as \"Registered\" ";
                                        sql += "	,SUM(CASE WHEN [AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN 1 ELSE 0 END) as \"Tested\" ";
                                        sql += "	,SUM(CASE WHEN [AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN 1 ELSE 0 END) as \"Authorised\" ";
                                        sql += "	,SUM(CASE WHEN [LIMSRejectionCode] IS NOT NULL AND [LIMSRejectionCode] <> '' THEN 1 ELSE 0 END) as \"Rejected\" ";

                                        sql += "	,SUM(CASE WHEN ([AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate) AND ";
                                        sql += "	   ([RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate) ";
                                        sql += "	   THEN 1 ELSE 0 END) as \"Tested_Workload\" ";

                                        sql += "	,SUM(CASE WHEN ([AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate) AND ";
                                        sql += "	   ([RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate) AND ";
                                        sql += "	   ([AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate) ";
                                        sql += "	   THEN 1 ELSE 0 END) as \"Authorised_Workload\"  ";

                                        sql += "FROM [OpenLDRData].[dbo].[Requests] ";
                                        sql += "WHERE  ";
                                        sql += "	(";
                                        sql += "		([RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate) OR ";
                                        sql += "		([AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate) OR ";
                                        sql += "		([AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate) ";
                                        sql += "	 )";
                                        sql += "	AND (CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(day,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(day,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(day,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) <> 0 ";
                                        sql += "	AND (CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(month,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(month,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(month,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) <> 0 ";
                                        sql += "	AND (CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(year,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(year,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(year,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) <> 0 ";
                                        sql += "	AND LEFT([RequestID],5) <> 'TZSTS' ";
                                        sql += "	AND LEFT([RequestID],5) <> 'TZHUB' ";
                                        sql += "	AND LEFT([RequestID],5) <> 'TZMNH' ";
                                        sql += "	AND LEFT([RequestID],7) <> 'TZTILLE' ";
                                        sql += "	AND [LIMSPanelCode] IN ('" + testcode + "') ";
                                        sql += "GROUP BY  ";
                                        sql += "   (CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(year,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]   >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(year,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime] >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(year,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) ";
                                        sql += "   ,(CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(month,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]    >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(month,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime]  >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(month,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) ";
                                        sql += "   ,(CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(day,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]    >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(day,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime]  >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(day,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) ";
                                        sql += "	,(CASE WHEN LEFT([RequestID],6) = 'TZDISA' THEN 'Disa*Lab' ";
                                        sql += "      WHEN LEFT([RequestID],6) = 'TZNACP' THEN 'EVLIMS'  ";
                                        sql += "	    WHEN LEFT([RequestID],9) = 'TZLABMATE' THEN 'LabMate' ";
                                        sql += "	    WHEN LEFT([RequestID],6) = 'TZSKYL' THEN 'SkyLIMS' ";
                                        sql += "	    WHEN LEFT([RequestID],5) = 'TZSTS' THEN 'eSRS' ";
                                        sql += "		WHEN LEFT([RequestID],7) = 'TZJEEVA'   THEN 'Jeeva' ";
                                        sql += "      ELSE 'Unknown' END), ";
                                        sql += "	  (CASE WHEN RIGHT(LEFT([RequestID],9),3) IN ('TZA','TZC','TZH')								THEN 'Mnazi Mmoja' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TDS','TEQ')										THEN 'NHL-QATC' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TMS','TMC','TMH')									THEN 'Kilimanjaro Christian Medical Centre' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TBA','TBC','TBG')									THEN 'Bugando Medical Centre' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TMA','TMB','TMG')									THEN 'Mbeya Zonal Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-IRI' OR [RequestID] = 'iringarrh'					THEN 'Iringa Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-MTR' OR [RequestID] = 'ligularrh'					THEN 'Ligula Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-DOD' OR [RequestID] = 'dodoma'						THEN 'Dodoma Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-SNG'													THEN 'Singida Region Referral' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-TBR'													THEN 'Kitete Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-STF'													THEN 'St. Francis Designated District Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-STE','TZNACP-STS')									THEN 'Iringa Dream Molecular Laboratory' "; // --109580-1
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-MTM', 'TZNACP-MMT') OR [RequestID] = 'mtmerurrh'	THEN 'Mt. Meru' ";
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-MOR', 'TZNACP-MRO') OR [RequestID] = 'morogoro'	THEN 'Morogoro Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],9)  = 'TZLABMATE'													THEN 'MDH - Temeke' ";
                                        sql += "		   WHEN LEFT([RequestID],11) = 'TZSKYLNDAND'												THEN 'Ndanda Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],7)  = 'TZJEEVA' AND [LIMSFacilityCode] = 'TZMNH#JEEVA'				THEN 'Muhimbili Referral Hospital at National Level' ";
                                        sql += "		   ELSE 'Unknown : '+[RequestID] END) ";
                                        sql += "		,[LIMSPanelCode] ";
                                        sql += "ORDER BY  ";
                                        sql += "	[LIMSPanelCode], ";
                                        sql += "   (CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(year,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]    >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(year,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime]  >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(year,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) ";
                                        sql += "   ,(CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(month,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]    >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(month,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime]  >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(month,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) ";
                                        sql += "   ,(CASE WHEN [RegisteredDateTime] >= @StartDate AND [RegisteredDateTime] < @EndDate THEN DATEPART(day,[RegisteredDateTime]) ";
                                        sql += "         WHEN [AnalysisDateTime]    >= @StartDate AND [AnalysisDateTime]   < @EndDate THEN DATEPART(day,[AnalysisDateTime]) ";
                                        sql += "         WHEN [AuthorisedDateTime]  >= @StartDate AND [AuthorisedDateTime] < @EndDate THEN DATEPART(day,[AuthorisedDateTime]) ";
                                        sql += "         ELSE 0 END) ";
                                        sql += "	,(CASE WHEN LEFT([RequestID],6) = 'TZDISA' THEN 'Disa*Lab' ";
                                        sql += "      WHEN LEFT([RequestID],6) = 'TZNACP' THEN 'EVLIMS'  ";
                                        sql += "	    WHEN LEFT([RequestID],9) = 'TZLABMATE' THEN 'LabMate' ";
                                        sql += "	    WHEN LEFT([RequestID],6) = 'TZSKYL' THEN 'SkyLIMS' ";
                                        sql += "	    WHEN LEFT([RequestID],5) = 'TZSTS' THEN 'eSRS' ";
                                        sql += "		WHEN LEFT([RequestID],7) = 'TZJEEVA'   THEN 'Jeeva' ";
                                        sql += "      ELSE 'Unknown' END), ";
                                        sql += "	  (CASE WHEN RIGHT(LEFT([RequestID],9),3) IN ('TZA','TZC','TZH')								THEN 'Mnazi Mmoja' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TDS','TEQ')										THEN 'NHL-QATC' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TMS','TMC','TMH')									THEN 'Kilimanjaro Christian Medical Centre' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TBA','TBC','TBG')									THEN 'Bugando Medical Centre' ";
                                        sql += "		   WHEN RIGHT(LEFT([RequestID],9),3) IN ('TMA','TMB','TMG')									THEN 'Mbeya Zonal Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-IRI' OR [RequestID] = 'iringarrh'					THEN 'Iringa Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-MTR' OR [RequestID] = 'ligularrh'					THEN 'Ligula Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-DOD' OR [RequestID] = 'dodoma'						THEN 'Dodoma Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-SNG'													THEN 'Singida Region Referral' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-TBR'													THEN 'Kitete Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) = 'TZNACP-STF'													THEN 'St. Francis Designated District Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-STE','TZNACP-STS')									THEN 'Iringa Dream Molecular Laboratory' "; // --109580-1
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-MTM', 'TZNACP-MMT') OR [RequestID] = 'mtmerurrh'	THEN 'Mt. Meru' ";
                                        sql += "		   WHEN LEFT([RequestID],10) IN ('TZNACP-MOR', 'TZNACP-MRO') OR [RequestID] = 'morogoro'	THEN 'Morogoro Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],9)  = 'TZLABMATE'													THEN 'MDH - Temeke' ";
                                        sql += "		   WHEN LEFT([RequestID],11) = 'TZSKYLNDAND'												THEN 'Ndanda Regional Referral Hospital' ";
                                        sql += "		   WHEN LEFT([RequestID],7)  = 'TZJEEVA' AND [LIMSFacilityCode] = 'TZMNH#JEEVA'				THEN 'Muhimbili Referral Hospital at National Level' ";
                                        sql += "		   ELSE 'Unknown : '+[RequestID] END) ";
                                        
                                        let pool = await mssql.connect(DB_URI);
                                        list = (await pool.request()
                                                                .query(sql)).recordset;
                                        pool.close();
                                    }
                
                                    if(returntype == "json")res.status(200).json(toJson("Successful", list));
                                    else if(returntype == "xml"){
                                        res.set('Content-Type', 'text/xml');
                                        res.status(200).send(toXML("Successful", { request:list }));
                                    }
                                }
                                catch (err) {
                                    console.log(err.message);
                                    res.status(501).json(toJson("Error", err.message));
                                }
                            }
                            else res.status(501).json(toJson("Error", "Month can only be 1 to 12"));
                        }
                        else res.status(501).json(toJson("Error", "Year can only be 1900 to 9999"));
                    }
                    else res.status(501).json(toJson("Error", "Unsupported test code"));               
                }
                else res.status(501).json(toJson("Error", "Invalid return type"));
            }
            else res.status(501).json(toJson("Error", "Invalid version"));
        }
        else res.status(501).json(toJson("Error", "Extension not activated"));        
    });

    //Fix auth issue later
    app.get("/api/openldr/transmission/:version/report/tool", /*auth,*/ async (req, res) => {
        const version = req.params.version;
        const title = "Transmission";
        
        if(get_activated()){
            if(version.toLowerCase() == "v1"){
            
                const page_style = "min-width:297mm; min-height:297mm; background:#ffffff; padding:48px;";
    
                const tests_options = [
                    {code:"HIVVL", name:"Viral Load"},
                    {code:"HIVPC", name:"Early Infant Diagnosis"}
                ];
    
                const tests = [];
                tests.push(create_element( "option", {  "value":""}, "Test"));
                for(var i=0; i<tests_options.length; i++){
                    const test = tests_options[i]
                    tests.push(create_element( "option", {"value":`${test.code}`}, `${test.name}`));
                }
    
                const years = [];
                var current_year = (new Date()).getFullYear();
                years.push(create_element( "option", {  "value":""}, "Year"));
                for(var i=current_year; i>=2013; i--){
                    years.push(create_element( "option", {"value":`${i}`}, `${i}`));
                }
    
                const months = [];
                months.push(create_element( "option", {  "value":""}, "Month"));
                for(var i=1; i<=12; i++){
                    months.push(create_element( "option", {"value":`${i}`}, `${i}`));
                }
    
                const sections = [
                    create_element( "div", { "style":"margin-top:24px; margin-bottom:24px;" },[
                        create_element( "div", { "class":"px-4 Form section-block--body has-inputs-centered" },[
                            create_element( "div", { "class":"form-group" },[
                                //create_element( "label", null,"Test"),
                                create_element( "select", {
                                    "class":"db_test form-control",
                                    "style":"padding: 0.5rem 1rem; min-width:224px; margin-left:0px;"
                                },tests),
                            ]),
                        ]),
                        create_element( "div", { "class":"px-4 Form section-block--body has-inputs-centered" },[
                            create_element( "div", { "class":"form-group" },[
                                //create_element( "label", null,"Year"),
                                create_element( "select", {
                                    "class":"db_year form-control",
                                    "style":"padding: 0.5rem 1rem; min-width:224px; margin-left:0px;"
                                }, years)
                            ]),
                        ]),
                        create_element( "div", { "class":"px-4 Form section-block--body has-inputs-centered" },[
                            create_element( "div", { "class":"form-group" },[
                                //create_element( "label", null,"Month"),
                                create_element( "select", {
                                    "class":"db_month form-control",
                                    "style":"padding: 0.5rem 1rem; min-width:224px; margin-left:0px;"
                                },months)
                            ]),
                        ]),
                        create_element( "div", { "class":"my-4" },[
                            create_element( "div", { "class":"flex" },[
                                create_element( "span", { 
                                    "class":"px-4 sbui-btn-container",
                                    "style":"width:100%;"
                                },[
                                    create_element( "span", { 
                                        "class":"search-report-btn sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--tiny sbui-btn--text-align-center",
                                        "style":"width:100%;"
                                    },
                                    [ create_element( "span", null,"Search") ])
                                ])
                            ])
                        ])
                    ])
                ];
    
                const content = [
                    create_element( "div", { "class":"w-full max-w-screen flex flex-col" }, [
                        create_element( "div", { "class":"w-full max-w-screen flex border-b dark:border-dark", "style":"min-height:58px; max-height:58px;" }, [
                            create_element( "div", { "class":"flex", "style":"width:100%; height:100%;" }, [
                                
                            ]), 
                            create_element( "div", { "tooltip":"Download as PDF", "flow":"down", "class":"download-transmission-report-pdf inline-flex items-center justify-center h-10 w-10  mx-2 mt-2 rounded text-gray-300 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-bg-alt-dark dark:hover:text-white", "style":"cursor: pointer;" }, [
                                create_element("svg", { 
                                    "xmlns":"http://www.w3.org/2000/svg",
                                    "style":"width: 24px; height: 24px;"
                                },[            
                                    create_element("path", { "fill":"currentColor", "d":"M12,10.5H13V13.5H12V10.5M7,11.5H8V10.5H7V11.5M20,6V18A2,2 0 0,1 18,20H6A2,2 0 0,1 4,18V6A2,2 0 0,1 6,4H18A2,2 0 0,1 20,6M9.5,10.5A1.5,1.5 0 0,0 8,9H5.5V15H7V13H8A1.5,1.5 0 0,0 9.5,11.5V10.5M14.5,10.5A1.5,1.5 0 0,0 13,9H10.5V15H13A1.5,1.5 0 0,0 14.5,13.5V10.5M18.5,9H15.5V15H17V13H18.5V11.5H17V10.5H18.5V9Z" })
                                ])
                            ]), 
                            create_element( "div", { "tooltip":"Download as Excel", "flow":"down", "class":"download-transmission-report-excel inline-flex items-center justify-center h-10 w-10  mx-2 mt-2 rounded text-gray-300 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-bg-alt-dark dark:hover:text-white", "style":"cursor: pointer;" }, [
                                create_element("svg", { 
                                    "xmlns":"http://www.w3.org/2000/svg",
                                    "style":"width: 24px; height: 24px;"
                                },[            
                                    create_element("path", { "fill":"currentColor", "d":"M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 5.97 8.89H4.16L6.05 12.08L4 15.28H5.78M13.88 19.5V17H8.25V19.5M13.88 15.75V12.63H12V15.75M13.88 11.38V8.25H12V11.38M13.88 7V4.5H8.25V7M20.75 19.5V17H15.13V19.5M20.75 15.75V12.63H15.13V15.75M20.75 11.38V8.25H15.13V11.38M20.75 7V4.5H15.13V7Z" })
                                ])
                            ]), 
                            create_element( "div", { "tooltip":"Print", "flow":"down", "class":"print-transmission-report inline-flex items-center justify-center h-10 w-10  mx-2 mt-2 rounded text-gray-300 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-bg-alt-dark dark:hover:text-white", "style":"cursor: pointer; margin-right:24px;" }, [
                                create_element("svg", { 
                                    "xmlns":"http://www.w3.org/2000/svg",
                                    "class":"m-auto text-color-inherit", 
                                    "width":"24", 
                                    "height":"24",
                                    "viewBox":"0 0 24 24",
                                    "fill":"none", 
                                    "stroke":"currentColor", 
                                    "stroke-width":"2", 
                                    "stroke-linecap":"round", 
                                    "stroke-linejoin":"round",
                                    "style":"width: 18px; height: 18px;"
                                },[ 
                                    create_element("polyline", { "points":"6 9 6 2 18 2 18 9" }),           
                                    create_element("path", { "d":"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }),
                                    create_element("rect", { "x":"6", "y":"14", "width":"12", "height":"8" }),
                                ])
                            ]),    
                        ]),
                        create_element( "div", { "class":"w-full overflow-y-auto overflow-x-auto max-w-screen flex flex-col" }, [
                            create_element( "div", { "class":"max-w-7xl mx-auto space-y-16 p-4", "style":"width:100%;" }, [
                                create_element( "div", { "class":"flex items-center justify-center", "style":"margin:48px auto 48px auto;" }, [
                                    create_element( "div", { "class":"flex space-x-4 border rounded dark:border-dark bg-bg-secondary-light dark:bg-bg-secondary-dark shadow-md", "style":page_style }, [
                                        create_element( "div", { "id":"editorjs", "class":"editor" }, [
                            
                                        ])
                                    ])
                                ])
                            ])
                      ]),
                  ]),
                  //create_element("style", null, ".tc-table { height: fit-content; }"),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/checklist/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/code/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/delimiter/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/embed/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/header/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/image/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/inline-code/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/link/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/list/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/marker/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/quote/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/raw/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/simple-image/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/table/dist/table.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/warning/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/tools/report-header/dist/bundle.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editorjs/editor.js"}),
                  create_element("script", { "type":"text/javascript", "src":"/script/editor_report.js"}),
                  create_element("link", { "rel":"stylesheet", "type":"text/css", "href":"/css/editorjs.css"}),
                  create_element("script", null, 
                      functionify(()=>{
                            const get_selected_details = (item) => {
                                var val = $(`${item} option:selected`).val();
                                var text = $(`${item} option:selected`).text();
    
                                return { value:val, text:text };
                            };
    
                            $('.search-report-btn').unbind( "click" );
                            $('.search-report-btn').click(function() {
                                const db_test = get_selected_details(".db_test");
                                const db_year = get_selected_details(".db_year");
                                const db_month = get_selected_details(".db_month");
    
                                if(db_year.value != '' && db_month.value != '' && db_test.value != ''){
                                    var yearRex = /^(19[0-9]{2}|[2-9][0-9]{3})$/gi;
                                    var monthRex = /^([1-9]|0[1-9]|1[0-2])$/gi;
                                    
                                    if(yearRex.test(db_year.value)){
                                        if(monthRex.test(db_month.value)){			
                                            
                                            var timeout = 1000*60*5; //Time out after 5 minutes cause way too long
                                            
                                            //Fix this later, auth issue
                                            var payload = {
                                                "email":"fmwasekaga@gmail.com",
                                                "password":"e501e563-fef3-47ea-8751-bae55e284be9"
                                            };
    
                                            fetch('/api/openldr/token', {
                                                headers: {
                                                  'Accept': 'application/json',
                                                  'Content-Type': 'application/json'
                                                },
                                                method: "POST",
                                                body: JSON.stringify(payload)
                                            },timeout)
                                            .then((response) => response.json())
                                            .then((data) => {
                                                if(data.Status == "Successful"){
                                                    
                                                    var bearer = 'Bearer ' + data.Data.access_token;
                                                    
                                                    fetch(`/api/openldr/transmission/v1/json/${parseInt(db_year.value)}/${parseInt(db_month.value)}/${db_test.value}`, {                                                
                                                        headers: {
                                                          'Authorization': bearer,
                                                          'Accept': 'application/json',
                                                          'Content-Type': 'application/json'
                                                        }
                                                    },timeout)
                                                    .then((response) => response.json())
                                                    .then((collection) => {
    
                                                        if(collection.Status == "Successful"){
                                                           
                                                            $('.download-transmission-report-pdf').unbind( "click" );
                                                            $('.download-transmission-report-pdf').click(function() {
                                                                const doc_pdf = createTransmisionReport(collection.Data, parseInt(db_year.value), parseInt(db_month.value), db_test, 'pdf');
                                                            });

                                                            $('.download-transmission-report-excel').unbind( "click" );
                                                            $('.download-transmission-report-excel').click(function() {
                                                                const doc_excel = createTransmisionReport(collection.Data, parseInt(db_year.value), parseInt(db_month.value), db_test, 'excel');
                                                            });

                                                            $('.print-transmission-report').unbind( "click" );                            
                                                            $('.print-transmission-report').click(function() {
                                                                console.log("print not yet implemented");
                                                            });
                                                            
                                                            const doc = createTransmisionReport(collection.Data, parseInt(db_year.value), parseInt(db_month.value), db_test, 'editor');
                                                            init(doc);
                                                        }

                                                    })
                                                    .catch((error) => {
                                                        console.log(error);
                                                    });
    
                                                }
                                                else console.log(data);
    
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                            });	
    
                                            
                                        }
                                    }
                                }
                            });
                      })
                  )
                ];
    
                res.status(200).send(report(project, title, sections, content));
            }
            else res.status(501).json(toJson("Error", "Invalid version"));
        }
        else res.status(501).json(toJson("Error", "Extension not activated"));        
        
    });

    return true;
};

const get_report_templates = () =>{
    const report_templates = [];
    for(var ii =0; ii<1; ii++){

        //image from = https://picsum.photos/id/20/94/94
        const fakeImage = "data:image/jpeg;base64,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";
        
        report_templates.push({ url:fakeImage, link:"/api/openldr/transmission/v1/report/tool", name:"Transmission Report - [HVL/EID]", description:"Reporting tool to track data being sent to openldr" });
    }
    return report_templates;
};

module.exports = { get_report_templates, initialize, get_id, get_name, get_description, get_activated, set_activated, get_schema };