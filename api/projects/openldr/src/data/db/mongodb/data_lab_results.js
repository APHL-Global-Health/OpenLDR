const mongoose = require("mongoose");
module.exports = {
    datetimestamp: { type: Date, default: Date.now },
    versionstamp: { type: String, default: '1.0.0.0', maxLength:30 },
    limsdatetimestamp: { type: Date, default: Date.now },
    limsversionstamp: { type: String, default: '1.0.0.0', maxLength:30 },
    requestid: { type: String, required:true, index: true, maxLength:26 },
    obrsetid: { type: Number, required:true, default: 0, index: true },
    obxsetid: { type: Number, required:true, default: 0 },
    obxsubid: { type: Number, required:true, default: 0 },
    loinccode: { type: String, maxLength:30 },
    hl7resulttypecode: { type: String, maxLength:2 },
    sivalue: { type: mongoose.Schema.Types.Decimal128 },
    siunits: { type: String, maxLength:25 },
    silorange: { type: mongoose.Schema.Types.Decimal128 },
    sihirange: { type: mongoose.Schema.Types.Decimal128 },
    hl7abnormalflagcodes: { type: String, maxLength:5 },
    datetimevalue: { type: Date },
    codedvalue: { type: String, maxLength:1 },
    resultsemiquantitive: { type: Number },
    note: { type: Boolean },
    limsobservationcode: { type: String, maxLength:10 },
    limsobservationdesc: { type: String, maxLength:50 },
    limsrptresult: { type: String, maxLength:80 },
    limsrptunits: { type: String, maxLength:25 },
    limsrptflag: { type: String, maxLength:25 },
    limsrptrange: { type: String, maxLength:25 },
    limscodedvalue: { type: String, maxLength:5 },
    workunits: { type: mongoose.Schema.Types.Decimal128 },
    costunits: { type: mongoose.Schema.Types.Decimal128 },
    request: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "request"
            }
};