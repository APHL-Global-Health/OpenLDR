const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const xml2js = require('xml2js'); 
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { spawn } = require('child_process');

var auth = null;
var logger = null;
var mongo_helper = null;

var Dict_Permission = null;
var Dict_Role = null;
var Dict_User = null;

var Data_LabRequest = null;
var Data_LabResult = null;
var Data_Monitoring = null;

var DB_URI = null;
var DB_DRIVER = null;
var DB_DATA = null;
var DB_DICT = null;

var ACCESS_TOKEN_SECRET = null;
var ACCESS_TOKEN_LIFE = null;
var REFRESH_TOKEN_SECRET = null;
var REFRESH_TOKEN_LIFE = null;

const actions = ["requests","results","monitoring"];
const returntypes = ["json","xml"];

const request_structure = ['datetimestamp' ,'versionstamp' ,'limsdatetimestamp' ,'limsversionstamp' ,'requestid' ,'obrsetid' ,'loincpanelcode' ,'limspanelcode' ,'limspaneldesc' ,'hl7prioritycode' ,'specimendatetime' ,'registereddatetime' ,'receiveddatetime' ,'analysisdatetime' ,'authoriseddatetime' ,'admitattenddatetime' ,'collectionvolume' ,'requestingfacilitycode' ,'receivingfacilitycode' ,'limspointofcaredesc' ,'requesttypecode' ,'icd10clinicalinfocodes' ,'clinicalinfo' ,'hl7specimensourcecode' ,'limsspecimensourcecode' ,'limsspecimensourcedesc' ,'hl7specimensitecode' ,'limsspecimensitecode' ,'limsspecimensitedesc' ,'workunits' ,'costunits' ,'hl7sectioncode' ,'hl7resultstatuscode' ,'registeredby' ,'testedby' ,'authorisedby' ,'orderingnotes' ,'encryptedpatientid' ,'ageinyears' ,'ageindays' ,'hl7sexcode' ,'hl7ethnicgroupcode' ,'deceased' ,'newborn' ,'hl7patientclasscode' ,'attendingdoctor' ,'testingfacilitycode' ,'referringrequestid' ,'therapy' ,'limsanalyzercode' ,'targettimedays' ,'targettimemins' ,'limsrejectioncode' ,'limsrejectiondesc' ,'limsfacilitycode' ,'repeated' ,'limsprereg_registrationdatetime' ,'limsprereg_receiveddatetime' ,'limsprereg_registrationfacilitycode' ,'limsvendorcode', 'results', 'monitoring'];
const result_structure = ['datetimestamp' ,'versionstamp' ,'limsdatetimestamp' ,'limsversionstamp' ,'requestid' ,'obrsetid' ,'obxsetid' ,'obxsubid' ,'loinccode' ,'hl7resulttypecode' ,'sivalue' ,'siunits' ,'silorange' ,'sihirange' ,'hl7abnormalflagcodes' ,'datetimevalue' ,'codedvalue' ,'resultsemiquantitive' ,'note' ,'limsobservationcode' ,'limsobservationdesc' ,'limsrptresult' ,'limsrptunits' ,'limsrptflag' ,'limsrptrange' ,'limscodedvalue' ,'workunits' ,'costunits'];
const monitoring_structure = ['datetimestamp' ,'versionstamp' ,'limsdatetimestamp' ,'limsversionstamp' ,'requestid' ,'obrsetid' ,'obxsetid' ,'obxsubid' ,'loinccode' ,'organism' ,'surveillancecode' ,'specimendatetime' ,'limsobservationcode' ,'limsobservationdesc' ,'limsorganismgroup' ,'codedvalue' ,'resultsemiquantitive' ,'resultnotconfirmed' ,'resistantdrugs' ,'intermediatedrugs' ,'sensitivedrugs' ,'mdrcode'];

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

const normalise_struncture = (structure, action) =>{
    let list = [];
    let structures = structure;
    if(!Array.isArray(structure))structures = [structure];
    
    if(action == "requests"){
        structures.forEach((_structure)=>{
            let valid_values = null;
            let invalid_values = null;

            for (const [key, value] of Object.entries(_structure)) {
                if(request_structure.includes(key.toLowerCase())) {
                    if(valid_values == null) valid_values = {};
                    valid_values[key] = value;
                }
                else {
                    if(invalid_values == null) invalid_values = {};
                    invalid_values[key] = value;
                }

                if(key.toLowerCase() == "results"){
                    value.forEach((v)=>{
                        for (const [_key, _value] of Object.entries(v)) {
                            if(result_structure.includes(_key.toLowerCase())) {
                                if(valid_values == null) valid_values = {};
                                if(valid_values[key] == null) valid_values[key] = {};
                                valid_values[key][_key] = _value;
                            }
                            else {
                                if(invalid_values == null) invalid_values = {};
                                if(invalid_values[key] == null) invalid_values[key] = {};
                                invalid_values[key][_key] = _value;
                            }
                        }
                    });
                }

                if(key.toLowerCase() == "monitoring"){
                    value.forEach((v)=>{
                        for (const [_key, _value] of Object.entries(v)) {
                            if(monitoring_structure.includes(_key.toLowerCase())) {
                                if(valid_values == null) valid_values = {};
                                if(valid_values[key] == null) valid_values[key] = {};
                                valid_values[key][_key] = _value;
                            }
                            else {
                                if(invalid_values == null) invalid_values = {};
                                if(invalid_values[key] == null) invalid_values[key] = {};
                                invalid_values[key][_key] = _value;
                            }
                        }
                    });
                }
            }

            list.push({valid:valid_values, invalid:invalid_values });
        });
    }
    else if(action == "results"){
        structures.forEach((_structure)=>{
            let valid_values = null;
            let invalid_values = null;

            for (const [key, value] of Object.entries(_structure)) {
                if(result_structure.includes(key.toLowerCase())) {
                    if(valid_values == null) valid_values = {};
                    valid_values[key] = value;
                }
                else {
                    if(invalid_values == null) invalid_values = {};
                    invalid_values[key] = value;
                }
            }

            list.push({valid:valid_values, invalid:invalid_values });
        });
    }
    else if(action == "monitoring"){
        structures.forEach((_structure)=>{
            let valid_values = null;
            let invalid_values = null;

            for (const [key, value] of Object.entries(_structure)) {
                if(monitoring_structure.includes(key.toLowerCase())) {
                    if(valid_values == null) valid_values = {};
                    valid_values[key] = value;
                }
                else {
                    if(invalid_values == null) invalid_values = {};
                    invalid_values[key] = value;
                }
            }
        });

        list.push({valid:valid_values, invalid:invalid_values });
    }

    return list;
};

const temp_response = (req, res, returntype) => {
    if(returntype == "json")res.status(200).json(toJson("Error", "Not Implemented"));
    else if(returntype == "xml"){
        res.set('Content-Type', 'text/xml');
        res.status(200).send(toXML("Error", "Not Implemented"));
    }
};

const invalid_structure_response = (req, res, returntype, structures) => {
    const has_invalid = structures.some(f=> f.invalid != null);
    if(has_invalid){
        const responses = [];
        
        structures.forEach((structure, index)=>{
            if(structure.invalid != null){
                const info = {};

                for (const [key, value] of Object.entries(structure.valid)) {
                    if(key.toLowerCase() == "requestid" ||
                       key.toLowerCase() == "obrsetid" ||
                       key.toLowerCase() == "obxsetid" ||
                       key.toLowerCase() == "obxsubid")info[key.toLowerCase()] = value;
                }

                responses.push({index:index, info:info, fields:structure.invalid});
            }
        });
        
        if(returntype == "json")res.status(200).json(toJson("Invalid Data Structure", responses));
        else if(returntype == "xml"){
            res.set('Content-Type', 'text/xml');
            res.status(200).send(toXML("Invalid Data Structure", responses));
        }
    }
    
    return has_invalid;
};

//Fetch
const fetch_requests = async (req, res, returntype) => {   
    const constructURL = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    const query = mongo_helper.get_query(constructURL, DB_DRIVER);
   
    let list = [];
    if(DB_DRIVER == "mongodb"){
        try{
            //console.log(query);
            const parse_result = new Parser().parse(`SELECT * FROM t where ${query}`);
            //console.log(JSON.stringify(parse_result.where));
            const mongo_query = mongo_helper.ast_to_mongo(parse_result.where);

            //console.log(JSON.stringify(mongo_query));

            list = await Data_LabRequest.find(mongo_query,{'_id': 0});
        }
        catch(ex){
            console.log(ex);
        }
    }
    else if(DB_DRIVER == "mssql"){
        let sql  = `SELECT`;
            sql += `  [DateTimeStamp]`;
            sql += ` ,[Versionstamp]`;
            sql += ` ,[LIMSDateTimeStamp]`;
            sql += ` ,[LIMSVersionstamp]`;
            sql += ` ,[RequestID]`;
            sql += ` ,[OBRSetID]`;
            sql += ` ,[LOINCPanelCode]`;
            sql += ` ,[LIMSPanelCode]`;
            sql += ` ,[LIMSPanelDesc]`;
            sql += ` ,[HL7PriorityCode]`;
            sql += ` ,[SpecimenDateTime]`;
            sql += ` ,[RegisteredDateTime]`;
            sql += ` ,[ReceivedDateTime]`;
            sql += ` ,[AnalysisDateTime]`;
            sql += ` ,[AuthorisedDateTime]`;
            sql += ` ,[AdmitAttendDateTime]`;
            sql += ` ,[CollectionVolume]`;
            sql += ` ,[RequestingFacilityCode]`;
            sql += ` ,[ReceivingFacilityCode]`;
            sql += ` ,[LIMSPointOfCareDesc]`;
            sql += ` ,[RequestTypeCode]`;
            sql += ` ,[ICD10ClinicalInfoCodes]`;
            sql += ` ,[ClinicalInfo]`;
            sql += ` ,[HL7SpecimenSourceCode]`;
            sql += ` ,[LIMSSpecimenSourceCode]`;
            sql += ` ,[LIMSSpecimenSourceDesc]`;
            sql += ` ,[HL7SpecimenSiteCode]`;
            sql += ` ,[LIMSSpecimenSiteCode]`;
            sql += ` ,[LIMSSpecimenSiteDesc]`;
            sql += ` ,[WorkUnits]`;
            sql += ` ,[CostUnits]`;
            sql += ` ,[HL7SectionCode]`;
            sql += ` ,[HL7ResultStatusCode]`;
            sql += ` ,[RegisteredBy]`;
            sql += ` ,[TestedBy]`;
            sql += ` ,[AuthorisedBy]`;
            sql += ` ,[OrderingNotes]`;
            sql += ` ,[EncryptedPatientID]`;
            sql += ` ,[AgeInYears]`;
            sql += ` ,[AgeInDays]`;
            sql += ` ,[HL7SexCode]`;
            sql += ` ,[HL7EthnicGroupCode]`;
            sql += ` ,[Deceased]`;
            sql += ` ,[Newborn]`;
            sql += ` ,[HL7PatientClassCode]`;
            sql += ` ,[AttendingDoctor]`;
            sql += ` ,[TestingFacilityCode]`;
            sql += ` ,[ReferringRequestID]`;
            sql += ` ,[Therapy]`;
            sql += ` ,[LIMSAnalyzerCode]`;
            sql += ` ,[TargetTimeDays]`;
            sql += ` ,[TargetTimeMins]`;
            sql += ` ,[LIMSRejectionCode]`;
            sql += ` ,[LIMSRejectionDesc]`;
            sql += ` ,[LIMSFacilityCode]`;
            sql += ` ,[Repeated]`;
            sql += ` ,[LIMSPreReg_RegistrationDateTime]`;
            sql += ` ,[LIMSPreReg_ReceivedDateTime]`;
            sql += ` ,[LIMSPreReg_RegistrationFacilityCode]`;
            sql += ` ,[LIMSVendorCode] as"limsvendorcode"`;
            sql += ` FROM [${DB_DATA}].[dbo].[Requests] `;
            if(query != undefined && query != null && query.length > 0){
                sql += ` WHERE ${query}`;
            }

        let pool = await mssql.connect(process.env.DB_URI);
        list = (await pool.request()
                                .query(sql)).recordset;
        pool.close();
    }
    
    if(returntype == "json")res.status(200).json(toJson("Successful", list));
    else if(returntype == "xml"){
        res.set('Content-Type', 'text/xml');
        res.status(200).send(toXML("Successful", { request:list }));
    }
};
const fetch_results = async (req, res, returntype) => {
    const constructURL = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    const query = mongo_helper.get_query(constructURL, DB_DRIVER);

    let list = [];
    if(DB_DRIVER == "mongodb"){
        try{
            const parse_result = new Parser().parse(`SELECT * FROM t where ${query}`);
            const mongo_query = mongo_helper.ast_to_mongo(parse_result.where);
            list = await Data_LabResult.find(mongo_query,{'_id': 0});
        }
        catch(ex){
            console.log(ex);
        }
    }
    else if(DB_DRIVER == "mssql"){
        let sql  = `SELECT`;
            sql += `  [DateTimeStamp]`;
            sql += ` ,[Versionstamp]`;
            sql += ` ,[LIMSDateTimeStamp]`;
            sql += ` ,[LIMSVersionStamp]`;
            sql += ` ,[RequestID]`;
            sql += ` ,[OBRSetID]`;
            sql += ` ,[OBXSetID]`;
            sql += ` ,[OBXSubID]`;
            sql += ` ,[LOINCCode]`;
            sql += ` ,[HL7ResultTypeCode]`;
            sql += ` ,[SIValue]`;
            sql += ` ,[SIUnits]`;
            sql += ` ,[SILoRange]`;
            sql += ` ,[SIHiRange]`;
            sql += ` ,[HL7AbnormalFlagCodes]`;
            sql += ` ,[DateTimeValue]`;
            sql += ` ,[CodedValue]`;
            sql += ` ,[ResultSemiquantitive]`;
            sql += ` ,[Note]`;
            sql += ` ,[LIMSObservationCode]`;
            sql += ` ,[LIMSObservationDesc]`;
            sql += ` ,[LIMSRptResult]`;
            sql += ` ,[LIMSRptUnits]`;
            sql += ` ,[LIMSRptFlag]`;
            sql += ` ,[LIMSRptRange]`;
            sql += ` ,[LIMSCodedValue]`;
            sql += ` ,[WorkUnits]`;
            sql += ` ,[CostUnits]`;
            sql += ` FROM [${DB_DATA}].[dbo].[LabResults] `;

        let pool = await mssql.connect(process.env.DB_URI);
        list = (await pool.request()
                                .query(sql)).recordset;
        pool.close();
    }
    
    if(returntype == "json")res.status(200).json(toJson("Successful", list));
    else if(returntype == "xml"){
        res.set('Content-Type', 'text/xml');
        res.status(200).send(toXML("Successful", { result:list }));
    }
};
const fetch_monitoring = async (req, res, returntype) => {
    const constructURL = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    const query = mongo_helper.get_query(constructURL, DB_DRIVER);

    let list = [];
    if(DB_DRIVER == "mongodb"){
        try{
            const parse_result = new Parser().parse(`SELECT * FROM t where ${query}`);
            const mongo_query =  mongo_helper.ast_to_mongo(parse_result.where);
            list = await Data_Monitoring.find(mongo_query,{'_id': 0});
        }
        catch(ex){
            console.log(ex);
        }
    }
    else if(DB_DRIVER == "mssql"){
        let sql  = `SELECT`;
            sql += `  [DateTimeStamp]`;
            sql += ` ,[Versionstamp]`;
            sql += ` ,[LIMSDateTimeStamp]`;
            sql += ` ,[LIMSVersionstamp]`;
            sql += ` ,[RequestID]`;
            sql += ` ,[OBRSetID]`;
            sql += ` ,[OBXSetID]`;
            sql += ` ,[OBXSubID]`;
            sql += ` ,[LOINCCode]`;
            sql += ` ,[ORGANISM]`;
            sql += ` ,[SurveillanceCode]`;
            sql += ` ,[SpecimenDateTime]`;
            sql += ` ,[LIMSObservationCode]`;
            sql += ` ,[LIMSObservationDesc]`;
            sql += ` ,[LIMSOrganismGroup]`;
            sql += ` ,[CodedValue]`;
            sql += ` ,[ResultSemiquantitive]`;
            sql += ` ,[ResultNotConfirmed]`;
            sql += ` ,[ResistantDrugs]`;
            sql += ` ,[IntermediateDrugs]`;
            sql += ` ,[SensitiveDrugs]`;
            sql += ` ,[MDRCode]`;
            sql += ` FROM [${DB_DATA}].[dbo].[Monitoring] `;

        let pool = await mssql.connect(process.env.DB_URI);
        list = (await pool.request()
                                .query(sql)).recordset;
        pool.close();
    }
    
    if(returntype == "json")res.status(200).json(toJson("Successful", list));
    else if(returntype == "xml"){
        res.set('Content-Type', 'text/xml');
        res.status(200).send(toXML("Successful", { monitoring:list }));
    }
};

//Save
const insert_requests = async (req, res, returntype) => {
    const structures = normalise_struncture(req.body, "requests");
    if(!invalid_structure_response(req, res, returntype, structures)){
        const valid_structures = structures.filter(f=> f.valid != null);
        const valids = valid_structures.map(f=> f.valid );
        if(DB_DRIVER == "mongodb"){
            const session = await Data_LabRequest.startSession();
            session.startTransaction();

            var error = null;

            for(var x=0; x<valids.length; x++){
                const structure = valids[x];

                try {
                    const info_request = {};
                    const opts = { session };
                    for (const [key, value] of Object.entries(structure)) {
                        if(key.toLowerCase() != "results" && key.toLowerCase() != "monitoring")
                        info_request[key.toLowerCase()] = value;
                    }
                    
                    const data_request = await Data_LabRequest(info_request).save(opts);

                    if(structure.hasOwnProperty('Results') || structure.hasOwnProperty('results')){
                        const structure_results = null;
                        if(structure.hasOwnProperty('Results'))structure_results = structure.Results;
                        else if(structure.hasOwnProperty('results'))structure_results = structure.results;

                        if(structure_results != null){
                            const info_results = {};
                            for (const [_key, _value] of Object.entries(structure_results)) {
                                info_results[_key.toLowerCase()] = _value;
                            }

                            const data_results = await Data_LabResult(info_results).save(opts);
                        }                        
                    }

                    if(structure.hasOwnProperty('Monitoring') || structure.hasOwnProperty('monitoring')){
                        const structure_monitoring = null;
                        if(structure.hasOwnProperty('Monitoring'))structure_monitoring = structure.Monitoring;
                        else if(structure.hasOwnProperty('monitoring'))structure_monitoring = structure.monitoring;

                        if(structure_monitoring != null){
                            const info_monitoring = {};
                            for (const [_key, _value] of Object.entries(structure_monitoring)) {
                                info_monitoring[_key.toLowerCase()] = _value;
                            }

                            const data_monitoring = await Data_Monitoring(info_monitoring).save(opts);
                        }                        
                    }    
                } catch (err) {
                    error = err;
                    await session.abortTransaction();
                    session.endSession();
                    rolledback = true;
                    break;
                }
            }

            if(error == null){
                await session.commitTransaction();
                session.endSession();

                temp_response(req, res, returntype);
            }
            else {
                if(returntype == "json")res.status(501).json(toJson("Error", error.message));
                else if(returntype == "xml"){
                    res.set('Content-Type', 'text/xml');
                    res.status(501).send(toXML("Error", error.message));
                }
            }
        }
        else if(DB_DRIVER == "mssql"){
            temp_response(req, res, returntype);
        }
        
    
        
    }
};
const insert_results = async (req, res, returntype) => {
    const structures = normalise_struncture(req.body, "results");
    if(!invalid_structure_response(req, res, returntype, structures)){
        const valid_structures = structures.filter(f=> f.valid != null);
        const valids = valid_structures.map(f=> f.valid );

        // valids.forEach((structure)=>{
        //     //console.log(structure.invalid);
        //     //console.log(JSON.stringify(structure));
        // });
    
        temp_response(req, res, returntype);
    }
};
const insert_monitoring = async (req, res, returntype) => {
    const structures = normalise_struncture(req.body, "monitoring");
    if(!invalid_structure_response(req, res, returntype, structures)){
        const valid_structures = structures.filter(f=> f.valid != null);
        const valids = valid_structures.map(f=> f.valid );

        // valids.forEach((structure)=>{
        //     //console.log(structure.invalid);
        //     //console.log(JSON.stringify(structure));
        // });
    
        temp_response(req, res, returntype);
    }
};


//Update
const update_requests = async (req, res, returntype) => {
    const structures = normalise_struncture(req.body, "requests");
    if(!invalid_structure_response(req, res, returntype, structures)){
        const valid_structures = structures.filter(f=> f.valid != null);
        const valids = valid_structures.map(f=> f.valid );

        // valids.forEach((structure)=>{
        //     //console.log(structure.invalid);
        //     //console.log(JSON.stringify(structure));
        // });
    
        temp_response(req, res, returntype);
    }
};
const update_results = async (req, res, returntype) => {
    const structures = normalise_struncture(req.body, "results");
    if(!invalid_structure_response(req, res, returntype, structures)){
        const valid_structures = structures.filter(f=> f.valid != null);
        const valids = valid_structures.map(f=> f.valid );

        // valids.forEach((structure)=>{
        //     //console.log(structure.invalid);
        //     //console.log(JSON.stringify(structure));
        // });
    
        temp_response(req, res, returntype);
    }
};
const update_monitoring = async (req, res, returntype) => {
    const structures = normalise_struncture(req.body, "monitoring");
    if(!invalid_structure_response(req, res, returntype, structures)){
        const valid_structures = structures.filter(f=> f.valid != null);
        const valids = valid_structures.map(f=> f.valid );

        // valids.forEach((structure)=>{
        //     //console.log(structure.invalid);
        //     //console.log(JSON.stringify(structure));
        // });
    
        temp_response(req, res, returntype);
    }
};


//Delete
const delete_requests = async (req, res, returntype) => {
    const query = get_query(req, res, returntype);
    
    let result = null;
    if(DB_DRIVER == "mongodb"){
        try{
            const parse_result = new Parser().parse(`SELECT * FROM t where ${query}`);
            const mongo_query = ast_to_mongo(parse_result.where);
            const mongo_result = await Data_LabRequest.deleteMany(mongo_query);
            result = mongo_result.deletedCount > 0 ? "Deleted" : "Nothing Deleted";
        }
        catch(ex){
            console.log(ex);
        }
    }
    else if(DB_DRIVER == "mssql"){
        
        if(query != undefined && query != null && query.length > 0){
            let sql  = `SELECT [RequestID] `;
                sql += `FROM [${DB_DATA}].[dbo].[Requests] `;
                sql += `WHERE ${query}`;

            let pool = await mssql.connect(process.env.DB_URI);
            let _list = (await pool.request()
                                    .query(sql)).recordset;

            if(_list.length > 0){
                sql  = `DELETE `;
                sql += `FROM [${DB_DATA}].[dbo].[Requests] `;
                sql += `WHERE ${query}`;

                let _result = (await pool.request()
                                    .query(sql)).rowsAffected.shift();

                result = _result > 0 ? "Deleted" : "Nothing Deleted";
            }
            else result = "Doesn't Exists";
            
            pool.close();
        }
    }
    
    if(returntype == "json")res.status(200).json(toJson("Successful", result));
    else if(returntype == "xml"){
        res.set('Content-Type', 'text/xml');
        res.status(200).send(toXML("Successful", result));
    }
};
const delete_results = async (req, res, returntype) => {
    const query = get_query(req, res, returntype);
    
    let result = null;
    if(DB_DRIVER == "mongodb"){
        try{
            const parse_result = new Parser().parse(`SELECT * FROM t where ${query}`);
            const mongo_query = ast_to_mongo(parse_result.where);
            const mongo_result = await Data_LabResult.deleteMany(mongo_query);            
            result = mongo_result.deletedCount > 0 ? "Deleted" : "Nothing Deleted";
        }
        catch(ex){
            console.log(ex);
        }
    }
    else if(DB_DRIVER == "mssql"){
        
        if(query != undefined && query != null && query.length > 0){
            let sql  = `SELECT [RequestID] `;
                sql += `FROM [${DB_DATA}].[dbo].[LabResults] `;
                sql += `WHERE ${query}`;

            let pool = await mssql.connect(process.env.DB_URI);
            let _list = (await pool.request()
                                    .query(sql)).recordset;

            if(_list.length > 0){
                sql  = `DELETE `;
                sql += `FROM [${DB_DATA}].[dbo].[LabResults] `;
                sql += `WHERE ${query}`;

                let _result = (await pool.request()
                                    .query(sql)).rowsAffected.shift();

                result = _result > 0 ? "Deleted" : "Nothing Deleted";
            }
            else result = "Doesn't Exists";
            
            pool.close();
        }
    }
    
    if(returntype == "json")res.status(200).json(toJson("Successful", result));
    else if(returntype == "xml"){
        res.set('Content-Type', 'text/xml');
        res.status(200).send(toXML("Successful", result));
    }
};
const delete_monitoring = async (req, res, returntype) => {
    const query = get_query(req, res, returntype);
    
    let result = null;
    if(DB_DRIVER == "mongodb"){
        try{
            const parse_result = new Parser().parse(`SELECT * FROM t where ${query}`);
            const mongo_query = ast_to_mongo(parse_result.where);
            const mongo_result = await Data_Monitoring.deleteMany(mongo_query);           
            result = mongo_result.deletedCount > 0 ? "Deleted" : "Nothing Deleted";
        }
        catch(ex){
            console.log(ex);
        }
    }
    else if(DB_DRIVER == "mssql"){
        
        if(query != undefined && query != null && query.length > 0){
            let sql  = `SELECT [RequestID] `;
                sql += `FROM [${DB_DATA}].[dbo].[Monitoring] `;
                sql += `WHERE ${query}`;

            let pool = await mssql.connect(process.env.DB_URI);
            let _list = (await pool.request()
                                    .query(sql)).recordset;

            if(_list.length > 0){
                sql  = `DELETE `;
                sql += `FROM [${DB_DATA}].[dbo].[Monitoring]`;
                sql += `WHERE ${query}`;

                let _result = (await pool.request()
                                    .query(sql)).rowsAffected.shift();

                result = _result > 0 ? "Deleted" : "Nothing Deleted";
            }
            else result = "Doesn't Exists";
            
            pool.close();
        }
    }
    
    if(returntype == "json")res.status(200).json(toJson("Successful", result));
    else if(returntype == "xml"){
        res.set('Content-Type', 'text/xml');
        res.status(200).send(toXML("Successful", result));
    }
};

const use = async (server) => {
    const database_config = server.config.database;
    DB_URI = database_config.connection_string;
    DB_DRIVER = database_config.driver;
    DB_DATA = database_config.data_db;
    DB_DICT = database_config.dictionary_db;

    const authentication_config = server.config.authentication;
    ACCESS_TOKEN_SECRET = authentication_config.secret;
    ACCESS_TOKEN_LIFE = authentication_config.time;
    REFRESH_TOKEN_SECRET = authentication_config.refresh;
    REFRESH_TOKEN_LIFE = authentication_config.refresh_time;

    logger = server.logger;
    auth = require(path.join(server.root_path +server.config.paths.authentication));
    mongo_helper = require(path.join(server.ui_path +'/lib/mongo_helper'));

    Data_LabRequest = mongo_helper.model("/src/data/db/mongodb/data_requests.js", server.root_path, mongoose);
    Data_LabResult = mongo_helper.model("/src/data/db/mongodb/data_lab_results.js", server.root_path, mongoose);
    Data_Monitoring = mongo_helper.model("/src/data/db/mongodb/data_monitorings.js", server.root_path, mongoose);

    Dict_Permission = mongo_helper.model("/src/data/db/mongodb/dictionary_permissions.js", server.root_path, mongoose);
    Dict_Role = mongo_helper.model("/src/data/db/mongodb/dictionary_roles.js", server.root_path, mongoose);
    Dict_User = mongo_helper.model("/src/data/db/mongodb/dictionary_users.js", server.root_path, mongoose);
    
    const app = server.app;

    app.post("/api/openldr/register", async (req, res) => {

        // Our register logic starts here
        try {
            // Get user input
            const { email, password } = req.body;
        
            // Validate user input
            if (!(email && password)) {
                return res.status(400).json(toJson("Error", "All input is required"));
            }

            let authenticated_role = null;
            let oldUser = null;
            let user = null;

            if(DB_DRIVER == "mongodb"){
                authenticated_role = await Dict_Role.findOne({ name: 'authenticated' });
            }
            else if(DB_DRIVER == "mssql"){
                let sql  = `SELECT [Name] as "name" ,[Id] as "_id", [Title] as "title" `;
                    sql += ` FROM [${DB_DICT}].[dbo].[Roles] "role" `;
                    sql += ` WHERE [name]='authenticated'`;

                let pool = await mssql.connect(process.env.DB_URI);
                authenticated_role = (await pool.request()
                                        .query(sql)).recordset.shift();
                pool.close();
            }
            

            //const authenticated_role = await Role.findOne({ name: 'authenticated' });
            if (authenticated_role == undefined || authenticated_role == null) {
                return res.status(501).json(toJson("Error", "System not initialized, Contact administrator."));
            }

            // // check if user already exist
            // // Validate if user exist in our database
            if(DB_DRIVER == "mongodb"){
                oldUser = await Dict_User.findOne({ email },{'_id': 0});
            }
            else if(DB_DRIVER == "mssql"){
                let sql  = `SELECT [Email] as "email" `;
                    sql += ` FROM [${DB_DICT}].[dbo].[Users] `;
                    sql += ` WHERE [Email]=@email`;
    
                let pool = await mssql.connect(process.env.DB_URI);
                oldUser = (await pool.request()
                                         .input('email', mssql.NVarChar(email.length), email)
                                         .query(sql)).recordset.shift();
                pool.close();
            }
            
            if (oldUser) {
                return res.status(409).json(toJson("Error", "User Already Exist. Please Login"));
            }
        
            //Encrypt user password
            encryptedPassword = await bcrypt.hash(password, 10);

            // // Create user in our database
            

            if(DB_DRIVER == "mongodb"){
               user = await Dict_User.create({
                    email,
                    password: encryptedPassword,
                    role:authenticated_role._id
                });

                authenticated_role.users.push(user._id);
                await authenticated_role.save();
            }
            else if(DB_DRIVER == "mssql"){
                let sql  = `INSERT INTO [${DB_DICT}].[dbo].[Users] ([Email] ,[Password] ,[IsLocked]) `;
                    sql += `VALUES (@email, @password, @isLocked); `;
                    sql += ` `;
                    sql += `SELECT [Id] as "_id", [Email] as "email", [Password] as "password" `;
                    sql += `FROM [${DB_DICT}].[dbo].[Users] `;
                    sql += `WHERE [Id] = SCOPE_IDENTITY(); `;
    
                let pool = await mssql.connect(process.env.DB_URI);
                user = (await pool.request()
                                        .input('email', mssql.NVarChar(email.length), email)
                                        .input('password', mssql.NVarChar(encryptedPassword.length), encryptedPassword)
                                        .input('isLocked', mssql.Bit, 0)
                                        .query(sql)).recordset.shift();
    
    
                sql  = `INSERT INTO [${DB_DICT}].[dbo].[UserRoles] ([UserID] ,[RoleID]) `;
                sql += `VALUES (@userID, @roleID); `;
    
                pool = await mssql.connect(process.env.DB_URI);
                const user_role = (await pool.request()
                                            .input('userID', mssql.Int, user._id)
                                            .input('roleID', mssql.Int, authenticated_role._id)
                                            .query(sql));
                                            
                pool.close();
            }
            
            if(user != undefined && user != null){
                const payload ={ user_id: user._id, email };

                // Create token
                const access_token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
                    algorithm: "HS256",
                    expiresIn: parseInt(ACCESS_TOKEN_LIFE)
                });
    
                const refresh_token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
                    algorithm: "HS256",
                    expiresIn: parseInt(REFRESH_TOKEN_LIFE)
                });
        
                res.status(201).json({
                    Status : "Successful",
                    Data : {
                        access_token:access_token,
                        token_type:"bearer",
                        expires_in:parseInt(ACCESS_TOKEN_LIFE),
                        refresh_token:refresh_token
                }
                });
            }
            else return res.status(400).json(toJson("Error", "Failed to register user"));
            
        } catch (err) {
            console.log(err);
            res.status(501).json(toJson("Error", err.Message));
        }
    });

    app.post("/api/openldr/token", async (req, res) => {
        // Our login logic starts here
        try {
            // Get user input
            const { email, password } = req.body;

            let user = null;
        
            // Validate user input
            if (!(email && password)) {
                res.status(400).json(toJson("Error", "All input is required"));
            }
           
            // Validate if user exist in our database
            if(DB_DRIVER == "mongodb"){
                user = await Dict_User.findOne({ email },{'_id': 0});
             }
             else if(DB_DRIVER == "mssql"){
                let sql = `SELECT [Id] as "_id", [Email] as "email", [Password] as "password" `;
                    sql += `FROM [${DB_DICT}].[dbo].[Users] `;
                    sql += `WHERE [Email] = @email; `;

                let pool = await mssql.connect(DB_URI);
                user = (await pool.request()
                                        .input('email', mssql.NVarChar(email.length), email)
                                        .query(sql)).recordset.shift();
                pool.close();
            }
        
            if (user && (await bcrypt.compare(password, user.password))) {
                // Create token
                const payload ={ user_id: user._id, email };

                // Create token
                const access_token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
                    algorithm: "HS256",
                    expiresIn: parseInt(ACCESS_TOKEN_LIFE)
                });

                const refresh_token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
                    algorithm: "HS256",
                    expiresIn: parseInt(REFRESH_TOKEN_LIFE)
                });
        
                // save user token
                user.access_token = access_token;
                user.refresh_token = refresh_token;
        
                // user
                res.status(200).json({
                    Status : "Successful",
                    Data :  {
                        access_token:access_token,
                        token_type:"bearer",
                        expires_in:parseInt(ACCESS_TOKEN_LIFE),
                        refresh_token:refresh_token
                }
                });

            }
            else res.status(400).json(toJson("Error", "Invalid Credentials"));
        } catch (err) {
            console.log(err);
            res.status(501).json(toJson("Error", err.Message));
        }
    });

    app.get("/api/openldr/:version/:returntype/:action", auth, async (req, res) => {
        const version = req.params.version;
        const returntype = req.params.returntype;
        const action = req.params.action;
        
        if(version.toLowerCase() == "v1"){
            if(returntypes.includes(returntype.toLowerCase())){
                if(actions.includes(action.toLowerCase())){
                    try{
                        if(action.toLowerCase() == "requests") 
                            await fetch_requests(req, res, returntype);
                        else if(action.toLowerCase() == "results") 
                            await fetch_results(req, res, returntype);
                        else if(action.toLowerCase() == "monitoring") 
                            await fetch_monitoring(req, res, returntype);
                        else 
                            res.status(501).json(toJson("Error", "Unknown request"));
                    }
                    catch (err) {
                        res.status(501).json(toJson("Error", err.message));
                    }
                }
                else res.status(501).json(toJson("Error", "Action only accepting requests|results|monitoring"));
            }
            else res.status(501).json(toJson("Error", "Invalid return type"));
        }
        else res.status(501).json(toJson("Error", "Invalid version"));
    });

    app.post("/api/openldr/:version/:returntype/:action", auth, async (req, res) => {
        const version = req.params.version;
        const returntype = req.params.returntype;
        const action = req.params.action;

        if(version.toLowerCase() == "v1"){
            if(returntypes.includes(returntype.toLowerCase())){
                if(actions.includes(action.toLowerCase())){
                    try{
                        if(action.toLowerCase() == "requests") 
                            await insert_requests(req, res, returntype);
                        else if(action.toLowerCase() == "results") 
                            await insert_results(req, res, returntype);
                        else if(action.toLowerCase() == "monitoring") 
                            await insert_monitoring(req, res, returntype);
                        else 
                            res.status(501).json(toJson("Error", "Unknown request"));
                    }
                    catch (err) {
                        res.status(501).json(toJson("Error", err.Message));
                    }
                }
                else res.status(501).json(toJson("Error", "Action only accepting requests|results|monitoring"));
            }
            else res.status(501).json(toJson("Error", "Invalid return type"));
        }
        else res.status(501).json(toJson("Error", "Invalid version"));
    });

    app.put("/api/openldr/:version/:returntype/:action", auth, async (req, res) => {
        const version = req.params.version;
        const returntype = req.params.returntype;
        const action = req.params.action;

        if(version.toLowerCase() == "v1"){
            if(returntypes.includes(returntype.toLowerCase())){
                if(actions.includes(action.toLowerCase())){
                    try{
                        if(action.toLowerCase() == "requests") 
                            await update_requests(req, res, returntype);
                        else if(action.toLowerCase() == "results") 
                            await update_results(req, res, returntype);
                        else if(action.toLowerCase() == "monitoring") 
                            await update_monitoring(req, res, returntype);
                        else 
                            res.status(501).json(toJson("Error", "Unknown request"));
                    }
                    catch (err) {
                        res.status(501).json(toJson("Error", err.Message));
                    }
                }
                else res.status(501).json(toJson("Error", "Action only accepting requests|results|monitoring"));
            }
            else res.status(501).json(toJson("Error", "Invalid return type"));
        }
        else res.status(501).json(toJson("Error", "Invalid version"));
    });

    app.delete("/api/openldr/:version/:returntype/:action", auth, async (req, res) => {
        const version = req.params.version;
        const returntype = req.params.returntype;
        const action = req.params.action;

        if(version.toLowerCase() == "v1"){
            if(returntypes.includes(returntype.toLowerCase())){
                if(actions.includes(action.toLowerCase())){
                    try{
                        if(action.toLowerCase() == "requests") 
                            await delete_requests(req, res, returntype);
                        else if(action.toLowerCase() == "results") 
                            await delete_results(req, res, returntype);
                        else if(action.toLowerCase() == "monitoring") 
                            await delete_monitoring(req, res, returntype);
                        else 
                            res.status(501).json(toJson("Error", "Unknown request"));
                    }
                    catch (err) {
                        res.status(501).json(toJson("Error", err.Message));
                    }
                }
                else res.status(501).json(toJson("Error", "Action only accepting requests|results|monitoring"));
            }
            else res.status(501).json(toJson("Error", "Invalid return type"));
        }
        else res.status(501).json(toJson("Error", "Invalid version"));
    });

};

module.exports = {use};