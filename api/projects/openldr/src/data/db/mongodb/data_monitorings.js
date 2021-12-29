const mongoose = require("mongoose");
module.exports = {
    DateTimeStamp: { type: Date, default: Date.now },
    Versionstamp: { type: String, default: '1.0.0.0', maxLength:30 },
    LIMSDateTimeStamp: { type: Date, default: Date.now },
    LIMSVersionstamp: { type: String, default: '1.0.0.0', maxLength:30 },
    RequestID: { type: String, required:true, index: true, maxLength:26 },
    OBRSetID: { type: Number, required:true, index: true },
    OBXSetID: { type: Number, required:true, index: true },
    OBXSubID: { type: Number, required:true, index: true },
    LOINCCode: { type: String, maxLength:30 },
    ORGANISM: { type: String, maxLength:50 },
    SurveillanceCode: { type: String, maxLength:5 },
    SpecimenDateTime: { type: Date },
    LIMSObservationCode: { type: String, maxLength:25 },
    LIMSObservationDesc: { type: String, maxLength:50 },
    LIMSOrganismGroup: { type: String, maxLength:25 },
    CodedValue: { type: String, maxLength:1 },
    ResultSemiquantitive: { type: Number },
    ResultNotConfirmed: { type: Boolean },
    ResistantDrugs: { type: String, maxLength:250 },
    IntermediateDrugs: { type: String, maxLength:250 },
    SensitiveDrugs: { type: String, maxLength:250 },
    MDRCode: { type: String, maxLength:1 },
    request: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "request"
            }
};