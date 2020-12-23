CREATE DATABASE `OpenLDRData`;

USE `OpenLDRData`;

CREATE TABLE `LabResults`(
    `DateTimeStamp` datetime NULL,
    `Versionstamp` varchar(30) NULL,
    `LIMSDateTimeStamp` datetime NULL,
    `LIMSVersionStamp` varchar(30) NULL,
    `RequestID` varchar(26) NULL,
    `OBRSetID` int NULL,
    `OBXSetID` int NULL,
    `OBXSubID` int NULL,
    `LOINCCode` varchar(30) NULL,
    `HL7ResultTypeCode` varchar(2) NULL,
    `SIValue` float NULL,
    `SIUnits` varchar(25) NULL,
    `SILoRange` float NULL,
    `SIHiRange` float NULL,
    `HL7AbnormalFlagCodes` varchar(5) NULL,
    `DateTimeValue` datetime NULL,
    `CodedValue` varchar(1) NULL,
    `ResultSemiquantitive` int NULL,
    `Note` bit NULL,
    `LIMSObservationCode` varchar(10) NULL,
    `LIMSObservationDesc` varchar(50) NULL,
    `LIMSRptResult` varchar(80) NULL,
    `LIMSRptUnits` varchar(25) NULL,
    `LIMSRptFlag` varchar(25) NULL,
    `LIMSRptRange` varchar(25) NULL,
    `LIMSCodedValue` varchar(5) NULL,
    `WorkUnits` float NULL,
    `CostUnits` float NULL
);

CREATE TABLE `Monitoring`(
    `DateTimeStamp` datetime NULL,
    `Versionstamp` varchar(30) NULL,
    `LIMSDateTimeStamp` datetime NULL,
    `LIMSVersionstamp` varchar(30) NULL,
    `RequestID` varchar(26) NULL,
    `OBRSetID` int NULL,
    `OBXSetID` int NULL,
    `OBXSubID` int NULL,
    `LOINCCode` varchar(30) NULL,
    `ORGANISM` varchar(50) NULL,
    `SurveillanceCode` varchar(5) NULL,
    `SpecimenDateTime` datetime NULL,
    `LIMSObservationCode` varchar(25) NULL,
    `LIMSObservationDesc` varchar(50) NULL,
    `LIMSOrganismGroup` varchar(25) NULL,
    `CodedValue` varchar(1) NULL,
    `ResultSemiquantitive` int NULL,
    `ResultNotConfirmed` bit NULL,
    `ResistantDrugs` varchar(250) NULL,
    `IntermediateDrugs` varchar(250) NULL,
    `SensitiveDrugs` varchar(250) NULL,
    `MDRCode` char(1) NULL
);

CREATE TABLE `Requests`(
    `DateTimeStamp` datetime NULL,
    `Versionstamp` varchar(30) NULL,
    `LIMSDateTimeStamp` datetime NULL,
    `LIMSVersionstamp` varchar(30) NULL,
    `RequestID` varchar(26) NULL,
    `OBRSetID` int NULL,
    `LOINCPanelCode` varchar(10) NULL,
    `LIMSPanelCode` varchar(10) NULL,
    `LIMSPanelDesc` varchar(50) NULL,
    `HL7PriorityCode` char(1) NULL,
    `SpecimenDateTime` datetime NULL,
    `RegisteredDateTime` datetime NULL,
    `ReceivedDateTime` datetime NULL,
    `AnalysisDateTime` datetime NULL,
    `AuthorisedDateTime` datetime NULL,
    `AdmitAttendDateTime` datetime NULL,
    `CollectionVolume` float NULL,
    `RequestingFacilityCode` varchar(15) NULL,
    `ReceivingFacilityCode` varchar(10) NULL,
    `LIMSPointOfCareDesc` varchar(50) NULL,
    `RequestTypeCode` varchar(3) NULL,
    `ICD10ClinicalInfoCodes` varchar(50) NULL,
    `ClinicalInfo` varchar(250) NULL,
    `HL7SpecimenSourceCode` varchar(10) NULL,
    `LIMSSpecimenSourceCode` varchar(10) NULL,
    `LIMSSpecimenSourceDesc` varchar(50) NULL,
    `HL7SpecimenSiteCode` varchar(10) NULL,
    `LIMSSpecimenSiteCode` varchar(10) NULL,
    `LIMSSpecimenSiteDesc` varchar(50) NULL,
    `WorkUnits` float NULL,
    `CostUnits` float NULL,
    `HL7SectionCode` varchar(3) NULL,
    `HL7ResultStatusCode` char(1) NULL,
    `RegisteredBy` varchar(250) NULL,
    `TestedBy` varchar(250) NULL,
    `AuthorisedBy` varchar(250) NULL,
    `OrderingNotes` varchar(250) NULL,
    `EncryptedPatientID` varchar(250) NULL,
    `AgeInYears` int NULL,
    `AgeInDays` int NULL,
    `HL7SexCode` char(1) NULL,
    `HL7EthnicGroupCode` char(3) NULL,
    `Deceased` bit NULL,
    `Newborn` bit NULL,
    `HL7PatientClassCode` char(1) NULL,
    `AttendingDoctor` varchar(50) NULL,
    `TestingFacilityCode` varchar(10) NULL,
    `ReferringRequestID` varchar(25) NULL,
    `Therapy` varchar(250) NULL,
    `LIMSAnalyzerCode` varchar(10) NULL,
    `TargetTimeDays` int NULL,
    `TargetTimeMins` int NULL,
    `LIMSRejectionCode` varchar(10) NULL,
    `LIMSRejectionDesc` varchar(250) NULL,
    `LIMSFacilityCode` varchar(15) NULL,
    `Repeated` tinyint NULL,
    `LIMSPreReg_RegistrationDateTime` datetime NULL,
    `LIMSPreReg_ReceivedDateTime` datetime NULL,
    `LIMSPreReg_RegistrationFacilityCode` varchar(15) NULL,
    `LIMSVendorCode` varchar(4) NULL
);

CREATE TABLE `VersionControl`(
    `DateTimeStamp` datetime NULL,
    `VersionActivationDate` datetime NULL,
    `VERBase` int NULL,
    `VERUpdate` int NULL,
    `VERBuild` int NULL,
    `VersionStamp` varchar(20) NULL
);

CREATE DATABASE `OpenLDRDict`;

USE `OpenLDRDict`;

CREATE TABLE `Analyzers`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `FacilityCode` nchar(10) NULL,
    `AnalyzerDesc` varchar(50) NULL,
    `LIMSCode` varchar(3) NULL,
    `LIMSAnalyzerCode` varchar(10) NULL,
    `Manufacturer` varchar(50) NULL,
    `SerialNo` varchar(50) NULL,
    `Model` varchar(50) NULL,
    `InstalledDate` datetime NULL
);

CREATE TABLE `Drug_DrugClass`(
    `Drug` nvarchar(256) NOT NULL,
    `DrugClass` nvarchar(128) NOT NULL,
 CONSTRAINT `Drug_Category_PK` PRIMARY KEY NONCLUSTERED 
(
    `Drug` ASC
));

CREATE TABLE `Facilities`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `FacilityCode` varchar(15) NULL,
    `Description` varchar(100) NULL,
    `FacilityType` varchar(3) NULL,
    `CountryCode` varchar(2) NULL,
    `ProvinceCode` varchar(2) NULL,
    `RegionCode` varchar(2) NULL,
    `DistrictCode` varchar(2) NULL,
    `SubDistrictCode` varchar(2) NULL,
    `LattLong` geometry NULL,
    `MoHFacilityCode` nvarchar(15) NULL
);

CREATE TABLE `HealthcareAreas`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HealthcareAreaCode` varchar(10) NULL,
    `HealthcareAreaDesc` varchar(50) NULL,
    `LattLong` geometry NULL
);

CREATE TABLE `HL7AbnormalFlagCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7AbnormalFlagCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `HL7EthnicGroupCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7EthnicGroupCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `HL7PatientClassCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7PatientClassCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `HL7ResultStatusCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7ResultStatusCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `HL7ResultTypeCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7ResultTypeCode` varchar(3) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `HL7SectionCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7SectionCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `HL7SexCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7SexCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `HL7SpecimenSiteCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7SpecimenSiteCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `HL7SpecimenSourceCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `HL7SpecimenSourceCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `Laboratories`(
    `DateTimeStamp` datetime NULL,
    `Versionstamp` varchar(30) NULL,
    `LIMSVendorCode` varchar(4) NULL,
    `LabCode` varchar(15) NULL,
    `FacilityCode` varchar(15) NULL,
    `LabName` varchar(50) NULL,
    `LabType` varchar(25) NULL,
    `StaffingLevel` varchar(25) NULL
);

CREATE TABLE `LOINC`(
    `LOINC_NUM` varchar(10) NULL,
    `COMPONENT` varchar(255) NULL,
    `PROPERTY` varchar(30) NULL,
    `TIME_ASPCT` varchar(15) NULL,
    `SYSTEM` varchar(100) NULL,
    `SCALE_TYP` varchar(30) NULL,
    `METHOD_TYP` varchar(50) NULL,
    `CLASS` varchar(20) NULL,
    `STATUS` varchar(11) NULL,
    `CONSUMER_NAME` varchar(255) NULL,
    `MOLAR_MASS` varchar(13) NULL,
    `CLASSTYPE` numeric(1, 0) NULL,
    `FORMULA` varchar(255) NULL,
    `SPECIES` varchar(20) NULL,
    `ACSSYM` varchar(1000) NULL,
    `BASE_NAME` varchar(50) NULL,
    `UNITSREQUIRED` char(1) NULL,
    `SUBMITTED_UNITS` varchar(30) NULL,
    `RELATEDNAMES2` varchar(1000) NULL,
    `SHORTNAME` varchar(40) NULL,
    `ORDER_OBS` varchar(15) NULL,
    `HL7_FIELD_SUBFIELD_ID` varchar(50) NULL,
    `EXAMPLE_UNITS` varchar(255) NULL,
    `LONG_COMMON_NAME` varchar(255) NULL,
    `HL7_V2_DATATYPE` varchar(255) NULL,
    `CURATED_RANGE_AND_UNITS` varchar(1000) NULL,
    `EXAMPLE_UCUM_UNITS` varchar(255) NULL,
    `EXAMPLE_SI_UCUM_UNITS` varchar(255) NULL,
    `STATUS_REASON` varchar(9) NULL,
    `HL7_ATTACHMENT_STRUCTURE` varchar(50) NULL
);

CREATE TABLE `MDRCodes`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `MDRCode` varchar(10) NULL,
    `Description` varchar(100) NULL
);

CREATE TABLE `Surveilance`(
    `DateTimeStamp` datetime NULL,
    `VersionStamp` varchar(30) NULL,
    `SurveilanceCode` varchar(5) NULL,
    `SurveilanceDescription` varchar(50) NULL,
    `LOINC` varchar(30) NULL,
    `Organism` varchar(50) NULL
);

CREATE TABLE `VersionControl`(
    `DateTimeStamp` datetime NULL,
    `VersionActivationDate` datetime NULL,
    `VERBase` decimal(5, 0) NULL,
    `VERUpdate` decimal(5, 0) NULL,
    `VERBuild` decimal(5, 0) NULL,
    `VersionStamp` varchar(20) NULL
);