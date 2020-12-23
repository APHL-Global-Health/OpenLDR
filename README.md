Open Laboratory Data Repository
======

![](/images/version.svg) ![](/images/license.svg) ![](/images/database_platforms.svg)


The OpenLDR provides a single storage location for the country-wide electronic data regarding laboratory 
requests and results. This allows laboratory systems managers to easily view relevant data on the entire 
country, different geographic levels or detailed data down to the lab and section. A major design goal of 
the OpenLDR is to accommodate data from laboratories which use disparate Laboratory Information Management 
Systems (LIMS). The OpenLDR defines a simple, easy to understand data model in order to simplify the 
merging of data, data analysis and the creation of report templates. The OpenLDR design specification can 
be implemented utilizing any relational database. While the design is “open” the data is not and is 
expected to be securely hosted by the aggregating organization (e.g. Ministry of Health).

<div class="no-dot">

- [x]  Drug susceptibility rates
- [x]  Viral Load suppression rates
- [x]  Early Infant Diagnosis results
- [x]  Laboratory workload by laboratory section and instrument
- [x]  Turn Around Times
- [x]  Demographic breakdowns for system use and test outcomes
- [x]  Geographic sample collection versus testing locations

</div>

Secure Data Storage / Shared Technology
-----
The data is owned and stored by each country in a secure and highly controlled environment. However, 
the open structure allows different countries and developers to share their development efforts 
while not sharing their data:

<div class="no-dot">

- [x]  Electronic data imports from LIS, instruments or other electronic systems
- [x]  Views into the data to simplify data for viewing and reporting
- [x]  Reporting templates and methodologies
- [x]  Data structure enhancements
- [x]  Data quality monitoring techniques
- [x]  Best practices

</div>

Simple Structure for Flexible Reporting
-----
The core structure is simple but each country can easily add supplemental data to do data 
correlations with other electronic systems like Electronic Medical Records Systems (EMR), 
existing country-wide data summarization systems (DHIS2), or population statistics.

A variety of analysis from simple to more complex models can be created from the data. 
With the data in a single location you can easily do side by side geographic comparisons.

As managers come to rely on the initial data visualizations they will also be able to 
more easily imagine other reports that will help them make better decisions. The 
database managers and developers can easily use the existing data transport and reporting 
infrastructures to collect more data and produce more reports.

-----

Data Model
==============
The data model was designed to be minimal and simplistic. The objective is to make it 
easy to insert data and for anyone to use the data model for analysis. Because this is 
not an "on-line" database it can take certain design liberties, such as de-normalization 
of data, to make it easy to understand. The tables have been separated into two distinct 
groups. "Data" tables contain the actual test request and test result data and are stored 
in a database instance named **OpenLDRData**. "Dictionary" tables hold the standardized lists 
and coded information used for look-ups and supplemental information and are stored in a 
database instance named **OpenLDRDict**. This separation into separate database instances is 
not strictly necessary but allows for more flexibility in data storage. The instances can be
created using the scripts below.

<details>
<summary>Microsoft SQL</summary>
	
<table style="width: 100%; display: table;">
	<tr>
		<th colspan="2" style="background:#000000; color:#ffffff;">MS SQL</th>
	</tr>
	<tr>
		<td style="background:#569CD6; color:#000000; font-weight:bold;">OpenLDRData</td>
		<td style="background:#569CD6; color:#000000; font-weight:bold;">OpenLDRDict</td>
	</tr>
	<tr style="background-color:#000000;">
		<td  valign="top">

```sql
USE "master";

CREATE DATABASE "OpenLDRData";

USE "OpenLDRData";

CREATE TABLE "dbo"."LabResults"(
	"DateTimeStamp" datetime NULL,
	"Versionstamp" varchar(30) NULL,
	"LIMSDateTimeStamp" datetime NULL,
	"LIMSVersionStamp" varchar(30) NULL,
	"RequestID" varchar(26) NULL,
	"OBRSetID" int NULL,
	"OBXSetID" int NULL,
	"OBXSubID" int NULL,
	"LOINCCode" varchar(30) NULL,
	"HL7ResultTypeCode" varchar(2) NULL,
	"SIValue" float NULL,
	"SIUnits" varchar(25) NULL,
	"SILoRange" float NULL,
	"SIHiRange" float NULL,
	"HL7AbnormalFlagCodes" varchar(5) NULL,
	"DateTimeValue" datetime NULL,
	"CodedValue" varchar(1) NULL,
	"ResultSemiquantitive" int NULL,
	"Note" bit NULL,
	"LIMSObservationCode" varchar(10) NULL,
	"LIMSObservationDesc" varchar(50) NULL,
	"LIMSRptResult" varchar(80) NULL,
	"LIMSRptUnits" varchar(25) NULL,
	"LIMSRptFlag" varchar(25) NULL,
	"LIMSRptRange" varchar(25) NULL,
	"LIMSCodedValue" varchar(5) NULL,
	"WorkUnits" float NULL,
	"CostUnits" float NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."Monitoring"(
	"DateTimeStamp" datetime NULL,
	"Versionstamp" varchar(30) NULL,
	"LIMSDateTimeStamp" datetime NULL,
	"LIMSVersionstamp" varchar(30) NULL,
	"RequestID" varchar(26) NULL,
	"OBRSetID" int NULL,
	"OBXSetID" int NULL,
	"OBXSubID" int NULL,
	"LOINCCode" varchar(30) NULL,
	"ORGANISM" varchar(50) NULL,
	"SurveillanceCode" varchar(5) NULL,
	"SpecimenDateTime" datetime NULL,
	"LIMSObservationCode" varchar(25) NULL,
	"LIMSObservationDesc" varchar(50) NULL,
	"LIMSOrganismGroup" varchar(25) NULL,
	"CodedValue" varchar(1) NULL,
	"ResultSemiquantitive" int NULL,
	"ResultNotConfirmed" bit NULL,
	"ResistantDrugs" varchar(250) NULL,
	"IntermediateDrugs" varchar(250) NULL,
	"SensitiveDrugs" varchar(250) NULL,
	"MDRCode" char(1) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."Requests"(
	"DateTimeStamp" datetime NULL,
	"Versionstamp" varchar(30) NULL,
	"LIMSDateTimeStamp" datetime NULL,
	"LIMSVersionstamp" varchar(30) NULL,
	"RequestID" varchar(26) NULL,
	"OBRSetID" int NULL,
	"LOINCPanelCode" varchar(10) NULL,
	"LIMSPanelCode" varchar(10) NULL,
	"LIMSPanelDesc" varchar(50) NULL,
	"HL7PriorityCode" char(1) NULL,
	"SpecimenDateTime" datetime NULL,
	"RegisteredDateTime" datetime NULL,
	"ReceivedDateTime" datetime NULL,
	"AnalysisDateTime" datetime NULL,
	"AuthorisedDateTime" datetime NULL,
	"AdmitAttendDateTime" datetime NULL,
	"CollectionVolume" float NULL,
	"RequestingFacilityCode" varchar(15) NULL,
	"ReceivingFacilityCode" varchar(10) NULL,
	"LIMSPointOfCareDesc" varchar(50) NULL,
	"RequestTypeCode" varchar(3) NULL,
	"ICD10ClinicalInfoCodes" varchar(50) NULL,
	"ClinicalInfo" varchar(250) NULL,
	"HL7SpecimenSourceCode" varchar(10) NULL,
	"LIMSSpecimenSourceCode" varchar(10) NULL,
	"LIMSSpecimenSourceDesc" varchar(50) NULL,
	"HL7SpecimenSiteCode" varchar(10) NULL,
	"LIMSSpecimenSiteCode" varchar(10) NULL,
	"LIMSSpecimenSiteDesc" varchar(50) NULL,
	"WorkUnits" float NULL,
	"CostUnits" float NULL,
	"HL7SectionCode" varchar(3) NULL,
	"HL7ResultStatusCode" char(1) NULL,
	"RegisteredBy" varchar(250) NULL,
	"TestedBy" varchar(250) NULL,
	"AuthorisedBy" varchar(250) NULL,
	"OrderingNotes" varchar(250) NULL,
	"EncryptedPatientID" varchar(250) NULL,
	"AgeInYears" int NULL,
	"AgeInDays" int NULL,
	"HL7SexCode" char(1) NULL,
	"HL7EthnicGroupCode" char(3) NULL,
	"Deceased" bit NULL,
	"Newborn" bit NULL,
	"HL7PatientClassCode" char(1) NULL,
	"AttendingDoctor" varchar(50) NULL,
	"TestingFacilityCode" varchar(10) NULL,
	"ReferringRequestID" varchar(25) NULL,
	"Therapy" varchar(250) NULL,
	"LIMSAnalyzerCode" varchar(10) NULL,
	"TargetTimeDays" int NULL,
	"TargetTimeMins" int NULL,
	"LIMSRejectionCode" varchar(10) NULL,
	"LIMSRejectionDesc" varchar(250) NULL,
	"LIMSFacilityCode" varchar(15) NULL,
	"Repeated" tinyint NULL,
	"LIMSPreReg_RegistrationDateTime" datetime NULL,
	"LIMSPreReg_ReceivedDateTime" datetime NULL,
	"LIMSPreReg_RegistrationFacilityCode" varchar(15) NULL,
	"LIMSVendorCode" varchar(4) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."VersionControl"(
	"DateTimeStamp" datetime NULL,
	"VersionActivationDate" datetime NULL,
	"VERBase" int NULL,
	"VERUpdate" int NULL,
	"VERBuild" int NULL,
	"VersionStamp" varchar(20) NULL
) ON "PRIMARY";
```

</td>
<td>

```sql
USE "master";

CREATE DATABASE "OpenLDRDict";

USE "OpenLDRDict";

CREATE TABLE "dbo"."Analyzers"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"FacilityCode" nchar(10) NULL,
	"AnalyzerDesc" varchar(50) NULL,
	"LIMSCode" varchar(3) NULL,
	"LIMSAnalyzerCode" varchar(10) NULL,
	"Manufacturer" varchar(50) NULL,
	"SerialNo" varchar(50) NULL,
	"Model" varchar(50) NULL,
	"InstalledDate" datetime NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."Drug_DrugClass"(
	"Drug" nvarchar(256) NOT NULL,
	"DrugClass" nvarchar(128) NOT NULL,
 CONSTRAINT "Drug_Category_PK" PRIMARY KEY NONCLUSTERED 
(
	"Drug" ASC
)WITH (PAD_INDEX = OFF, 
STATISTICS_NORECOMPUTE = OFF, 
IGNORE_DUP_KEY = OFF, 
ALLOW_ROW_LOCKS = ON, 
ALLOW_PAGE_LOCKS = ON) ON "PRIMARY"
) ON "PRIMARY";

CREATE TABLE "dbo"."Facilities"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"FacilityCode" varchar(15) NULL,
	"Description" varchar(100) NULL,
	"FacilityType" varchar(3) NULL,
	"CountryCode" varchar(2) NULL,
	"ProvinceCode" varchar(2) NULL,
	"RegionCode" varchar(2) NULL,
	"DistrictCode" varchar(2) NULL,
	"SubDistrictCode" varchar(2) NULL,
	"LattLong" geography NULL,
	"MoHFacilityCode" nvarchar(15) NULL
) ON "PRIMARY" TEXTIMAGE_ON "PRIMARY";

CREATE TABLE "dbo"."HealthcareAreas"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HealthcareAreaCode" varchar(10) NULL,
	"HealthcareAreaDesc" varchar(50) NULL,
	"LattLong" geography NULL
) ON "PRIMARY" TEXTIMAGE_ON "PRIMARY";

CREATE TABLE "dbo"."HL7AbnormalFlagCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7AbnormalFlagCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."HL7EthnicGroupCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7EthnicGroupCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."HL7PatientClassCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7PatientClassCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."HL7ResultStatusCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7ResultStatusCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."HL7ResultTypeCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7ResultTypeCode" varchar(3) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."HL7SectionCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7SectionCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."HL7SexCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7SexCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."HL7SpecimenSiteCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7SpecimenSiteCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."HL7SpecimenSourceCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"HL7SpecimenSourceCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."Laboratories"(
	"DateTimeStamp" datetime NULL,
	"Versionstamp" varchar(30) NULL,
	"LIMSVendorCode" varchar(4) NULL,
	"LabCode" varchar(15) NULL,
	"FacilityCode" varchar(15) NULL,
	"LabName" varchar(50) NULL,
	"LabType" varchar(25) NULL,
	"StaffingLevel" varchar(25) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."LOINC"(
	"LOINC_NUM" varchar(10) NULL,
	"COMPONENT" varchar(255) NULL,
	"PROPERTY" varchar(30) NULL,
	"TIME_ASPCT" varchar(15) NULL,
	"SYSTEM" varchar(100) NULL,
	"SCALE_TYP" varchar(30) NULL,
	"METHOD_TYP" varchar(50) NULL,
	"CLASS" varchar(20) NULL,
	"STATUS" varchar(11) NULL,
	"CONSUMER_NAME" varchar(255) NULL,
	"MOLAR_MASS" varchar(13) NULL,
	"CLASSTYPE" numeric(1, 0) NULL,
	"FORMULA" varchar(255) NULL,
	"SPECIES" varchar(20) NULL,
	"ACSSYM" varchar(1000) NULL,
	"BASE_NAME" varchar(50) NULL,
	"UNITSREQUIRED" char(1) NULL,
	"SUBMITTED_UNITS" varchar(30) NULL,
	"RELATEDNAMES2" varchar(1000) NULL,
	"SHORTNAME" varchar(40) NULL,
	"ORDER_OBS" varchar(15) NULL,
	"HL7_FIELD_SUBFIELD_ID" varchar(50) NULL,
	"EXAMPLE_UNITS" varchar(255) NULL,
	"LONG_COMMON_NAME" varchar(255) NULL,
	"HL7_V2_DATATYPE" varchar(255) NULL,
	"CURATED_RANGE_AND_UNITS" varchar(1000) NULL,
	"EXAMPLE_UCUM_UNITS" varchar(255) NULL,
	"EXAMPLE_SI_UCUM_UNITS" varchar(255) NULL,
	"STATUS_REASON" varchar(9) NULL,
	"HL7_ATTACHMENT_STRUCTURE" varchar(50) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."MDRCodes"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"MDRCode" varchar(10) NULL,
	"Description" varchar(100) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."Surveilance"(
	"DateTimeStamp" datetime NULL,
	"VersionStamp" varchar(30) NULL,
	"SurveilanceCode" varchar(5) NULL,
	"SurveilanceDescription" varchar(50) NULL,
	"LOINC" varchar(30) NULL,
	"Organism" varchar(50) NULL
) ON "PRIMARY";

CREATE TABLE "dbo"."VersionControl"(
	"DateTimeStamp" datetime NULL,
	"VersionActivationDate" datetime NULL,
	"VERBase" decimal(5, 0) NULL,
	"VERUpdate" decimal(5, 0) NULL,
	"VERBuild" decimal(5, 0) NULL,
	"VersionStamp" varchar(20) NULL
) ON "PRIMARY";
```

</td>
</tr>
</table>
</details>

<details>
<summary>MySQL</summary>
<table style="width: 100%; display: table;">
<tr>
		<th colspan="2" style="background:#000000; color:#ffffff;">MySQL</th>
	</tr>
	<tr>
		<td style="background:#569CD6; color:#000000; font-weight:bold;">OpenLDRData</td>
		<td style="background:#569CD6; color:#000000; font-weight:bold;">OpenLDRDict</td>
	</tr>
	<tr style="background-color:#000000;">
		<td style="vertical-align:top;">

```sql
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
```
</td>
<td>

```sql
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
```
</td>
</tr>
</table>
</details>
	
<details>
<summary>PostgreSQL</summary>
<table style="width: 100%; display: table;">
<tr>
		<th colspan="2" style="background:#000000; color:#ffffff;">PostgreSQL</th>
	</tr>
	<tr>
		<td style="background:#569CD6; color:#000000; font-weight:bold;">OpenLDRData</td>
		<td style="background:#569CD6; color:#000000; font-weight:bold;">OpenLDRDict</td>
	</tr>
	<tr style="background-color:#000000;">
		<td style="vertical-align:top;">

```sql
--Not yet implemented
```
</td>
<td>

```sql
--Not yet implemented
```
</td>
</tr>
</table>
</details>
	
<details>
<summary>SQLite</summary>
<table style="width: 100%; display: table;">
<tr>
		<th colspan="2" style="background:#000000; color:#ffffff;">SQLite</th>
	</tr>
	<tr>
		<td style="background:#569CD6; color:#000000; font-weight:bold;">OpenLDRData</td>
		<td style="background:#569CD6; color:#000000; font-weight:bold;">OpenLDRDict</td>
	</tr>
	<tr style="background-color:#000000;">
		<td style="vertical-align:top;">

```sql
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
```
</td>
<td>

```sql
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
	 PRIMARY KEY(`Drug`)
);

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
```
</td>
</tr>
</table>
</details>

The column names within the tables have been chosen to be descriptive, and where they refer 
to a coding system, the name is prefixed by the coding system acronym.  The data model also 
provides for the coding system used by specific LIMS implementations.  These codes are 
prefixed by LIMS.  The following are the coding system prefixes used

<div class="full-table dark">

| Standard  | Infomation |
| ------------- | ------------- |
| **ICD10**  | [WHO International Classification of Diseases revision10](https://apps.who.int/classifications/icd10/browse/2010/en)  |
| **HL7**  | [Health Level 7](http://www.hl7.org)  |
| **LOINC**  | [Logical Observation Identifiers Names and Code](https://Loinc.Org)  |
| **LIMS**  | Codes used within the originating LIMS system  |

</div>

Data Tables
==============
The data model was intentionally designed to be simple. Individual implementations are 
expected to extend the model with related table to enhance the data with more information 
and expand upon codes and data from the various data providers. Even though there are only 
two primary tables the way the data is provided and stored is worth more explanation.

Requests
-----
(*Table: Requests*)\
This table holds all relevant data related to a laboratory test request. This table is 
very similar to the HL7 OBR segment, but it also contains demographic fields from the HL7 
PID, PV1 and PV2 segments. In designing the requests table, it was noted that each tests 
request form carries the patient's demographics - however, since laboratories often (usually?) 
do not see the patients, and since the data for the same patient may vary on subsequent requests. 
In these cases the laboratory has no way of knowing which of the two is correct (it may be neither) 
and so it needs to act on the information on the request form; e.g. the laboratory reports normal 
ranges based on age and sex as specified on the request form - and once a report has been released, 
the demographics and results that depend on this should not change. Common LIMS data models are 
usually either "patient-centric", "sample-centric" or "request-centric". OpenLDR has chosen a 
request centric model and keeps the history of these demographics is stored with each request. 
In practice, and because the OpenLDR has no patient identifiers, there is very little overhead in 
not having a "Master Patient Index" - Thus, instead of creating data hierarchy with patients at the 
apex, OpenLDR has requests at the apex and each request carries the "demographics as at the time of request".

OpenLDR does, however, allow requests from the same patient to be "linked" via a "Match Key", which 
the LIMS provider may optionally provide. This allows for other LIMS system designs to be accommodated 
(patient-centric, sample-centric and request-centric).

<details>
<summary>Table Details</summary>
<div class="full-table dark">

| Column Name  | Data Type | HL7 Segment | Note |
| ------------- | ------------- | ------------- | ------------- |
| **DateTimeStamp** | datetime |  | Timestamp the record was inserted into the LDR |
| **Versionstamp** | varchar(30) |  | Version of the LDR Database when this record was inserted or updated. Handled by database trigger. |
| **LIMSDateTimeStamp** | datetime |  | Date and timestamp of the record from the originating LIMS. |
| **LIMSVersionstamp** | varchar(30) |  | Version of the LIMS software where this result originated. |
| **RequestID** | varchar(26) | OBR-3 | {Country(2)+LIMS(4)+LabIdentifier(20)} E.g. TZDISATBA1234567 |
| **CountryCode** | varchar(2)   |  | Uniquely identify the country to which the data is attributed |
| **LIMSVendorCode** | varchar(4) |  | Identifies a LIMS system as the source of the data. Within a country this helps uniquely identify LIMS configurations that may use different codes internally such as ReceivingLabCode and TestingLabCode. Other codes specific to a LIMS implementation can be combined with this code to do LIMS specific look-ups. See section after table for more information |
| **OBRSetID** | int | OBR-1 | This, together with the RequestID form a unique identifier for the request. This is typically a sequential number representing the LIMSPanelCode and resets for each RequestID. e.g. One RequestID may have three LIMSPanelCodes and thus three Requests records with OBRSetIDs of 1, 2, 3. Another RequestID could also have OBRSetIDs of 1, 2, 3. |
| **LOINCPanelCode** | varchar(10) | OBR-4 | HL7 Universal Service ID |  |  |
| **LIMSPanelCode** | varchar(10) |  | A code identifying a list of tests to be performed on the sample. Individual outcomes have separate codes identified in the LabResults table. |
| **LIMSPanelDesc** | varchar(50) |  | Test Description as configured in originating LIMS system |
| **HL7PriorityCode** | char(1) | OBR-5 | (S)tat, (R)outine, (A)SAP - See HL7 4.4.6 |
| **SpecimenDateTime** | datetime | OBR-6 | Date and Time specimen was taken/collected (In HL7 this is termed Requested Time) |
| **RegisteredDateTime** | datetime | OBR-7 | Date and time specimen was registered in the LIMS |
| **ReceivedDateTime** | datetime | OBR-14 | Date and Time specimen was received in laboratory |
| **AnalysisDateTime** | datetime | OBX-14 | Date and Time the analysis was done on the results associated with this panel. All LabResults records for the Panel are expected to be performed at the same time (otherwise they should be associated with a different Panel). |  Yes - if applicable |  |
| **AuthorisedDateTime** | datetime |OBR-22  |Date and time results for the panel were authorised for release. See also AnalysisDateTime for incongruity with this column being in this table versus LabResults.  |  Yes - if applicable |  |
| **AdmitAttendDateTime** | datetime | PV1-44 | Admission Date and Time of the patient (for inpatients) or Attendance Date and Time for outpatients/clinics/health-centres | |  |
| **CollectionVolume** | float | OBR-9 | Volume of specimen in ml | |  |
| **v1:LIMSFacilityCode v2:RequestingFacilityCode v3:LIMSRequestingFacilityCode** | varchar(15) |  | Facility code (multi-component field.) as per the LDR facility dictionary. This is the facility making the request for the test to be performed. |
| **ReceivingFacilityCode** | varchar(10) |  | This is the first laboratory to log the request. See section after table for more information. | Yes - if applicable |  |
| **LIMSPointOfCareDesc** | varchar(50) | PV1-3 | Facility Description component of PV1-3 segment; description of location as configured in the originating LIMS.  For hospitals this will be the hospital name and ward. This is often directly related to the RequestingFacilityCode; however, this is an opportunity to expand upon that code/facility and record something more specific such as a department or ward. |
| **RequestTypeCode** | varchar(3) |  | If the requested test is for a human patient, the request is Diagnostic or Survey. For non-human tests, the request type is one of EQA//veterinary/Environmental Health. This is for internal reporting needs. Data providers should be requested to classify the tests for reporting purposes and provided with codes and examples of what tests belong under each code. |
| **ICD10ClinicalInfoCodes** | varchar(50) | OBR-13 | One or more ICD10 codes - supplied at time of request (delimited with pipe symbol \|) |
| **ClinicalInfo** | varchar(250) | OBR-13 | Free text as supplied at time of request (delimited with pipe symbol \|) |
| **HL7SpecimenSourceCode** | varchar(10) | OBR-15-1 | OBR-15 segment has multiple components; this is the first component labeled \<Specimen source code or name\> |
| **LIMSSpecimenSourceCode** | varchar(10) |  | Specimen source as coded in the originating LIMS system | |  |
| **LIMSSpecimenSourceDesc** | varchar(50) |  | Specimen source as described in the originating LIMS system | |  |
| **HL7SpecimenSiteCode** | varchar(10) | OBR-15-4  | OBR-15 segment has multiple components; this is component number 4 \<body site\> | |  |
| **LIMSSpecimenSiteCode** | varchar(10) |  | Specimen site as coded in the originating LIMS system | |  |
| **LIMSSpecimenSiteDesc** | varchar(50) |  | Specimen site as described in the originating LIMS system | |  |
| **WorkUnits** | float | OBR-23 | Number of technologist minutes required to perform this test method | |  |
| **CostUnits** | float |  | Cost to perform this test method | |  |
| **HL7SectionCode** | varchar(3) | OBR-24 | The laboratory section assigned the test. Data provider should be supplied with a list of standardized section codes. | |  |
| **HL7ResultStatusCode** | char(1) | OBR-25 | Status within the system. "X"-Rejected.  "A"-Incomplete; "F"-Reviewed "R"-Tested, "I"-Untested. | |  |
| **RegisteredBy** | varchar(250) |  | Person who registered the test request \<name\>  component of multi-component segment. Lastname ,firstname,initials, Qualification |
| **TestedBy** | varchar(250) | OBR-34 | Person who performed the test \<name\>  component of multi-component segment. Lastname ,firstname,initials, Qualification |  Yes - if applicable |  |
| **AuthorisedBy** | varchar(250) | OBR-32 | Person who interpreted the result and is responsible for it’s content. \<name\>  component of multi-component segment. Lastname ,firstname,initials, Qualification |  Yes - if applicable |  |
| **OrderingNotes** | varchar(250) | OBR-39 | Can be coded or free text | |  |
| **EncryptedPatientID** | varchar(250) |  | The originating LIMS will be responsible for encrypting some unique identifier for patient track-backs. This is also used for unique patient counts within the LDR. |
| **AgeInYears** | int |  | Patient age in full years |
| **AgeInDays** | int |  |  Patient age converted to days |
| **HL7SexCode** | char(1) | PID-8 |  |
| **HL7EthnicGroupCode** | char(3) | PID-22 |  |
| **Deceased** | bit | PID-30 | 1 = The patient is deceased. 0 = The patient is not deceased | | |
| **Newborn** | bit | PV2-36 | 1 = Patient Is a newborn. 0 = Patient is not a newborn |
| **HL7PatientClassCode** | char(1) | PV1-2 |  | |  |
| **AttendingDoctor** | varchar(50) | PV1-7 | Name and title  of Health Professional or requested the test | |  |
| **TestingFacilityCode** | varchar(10) |  | The laboratory where the testing was performed. This is required if analysis was performed but can be empty if there are no LabResults records (e.g. panel requested but no work yet performed). |
| **ReferringRequestID** | varchar(25) |  | Original RequestID from the referring laboratory. This is not currently implemented and the OpenLDR is not designed to be used for a sample referral and tracking system. | |  |
| **Therapy** | varchar(250) | 	PV2-39? | Therapy or drug treatments the patient is on when specimen was taken | |  |
| **LIMSAnalyzerCode** | varchar(10) | OBX-18 | LIMS code for analyser which perfomed this test. Originates in OBX but also store in OBR. \<entity identifier\> component of segment | | Yes |
| **TargetTimeDays** | int |  | Target Turn Around Time (TAT) in days- for long duration tests. Zero if there is a short TAT |
| **TargetTimeMins** | int |  | Target Turn Around Time (TAT) in hours - for short duration tests - Zero if there is a long TAT |
| **LIMSRejectionCode** | varchar(10) |  |  |  Yes - if applicable |  |
| **LIMSRejectionDesc** | varchar(250) |  | Text description of LIMS rejection code plus any further information provided with the rejection |  Yes - if applicable |  |
| **Repeated** | tinyint |  |
| **v2:LIMSPreReg_RegistrationDateTime** | datetime |  | For remote registration and results terminals |  |  |
| **v2:LIMSPreReg_ReceivedDateTime** | datetime |  | For remote registration and results terminals |  |  |
| **v2:LIMSPreReg_RegistrationFacilityCode** | varchar(15) |  | For remote registration and results terminals |  |  |
| **v2:LIMSSpecimenID** | varchar(64) | |  | 	NEW 6-Dec-17: This column allows the data provider to send in their unique id for the specimen which can help with validation, reporting, and trace-backs. | |  |
| **v2:RequestingFacilityNationalCode** | | | | A convenience column to uniquely identify the requesting facility using the national facility ID system value |  |  |

</div>
</details>

Results
-----
(*Table: LabResults*)\
The results table holds the results of all the test requests. A result may be for a single item, such as a 
Potassium result, or the test may comprise multiple items such as a Complete Blood Count. Results are 
identified by both LOINC codes and LIMS vendor codes. Results may be either numerical or coded values or 
text. For numerical values, the results and reference ranges must be converted to SI units at the time of 
loading into the results table and stored as floating point numbers. The value, as printed on thereport by 
the LIMS, is stored as text. These may be the cutoff value e.g. ">10.00", whereas internally, the value 
may be 11.5. The units, reference ranges and flags, as printed on the report are also stored as text. 
Thus, the full result, as printed on the report, can be re-recreated although no calculations can be done 
on them. By contrast, the results in SI units are able to be used for research and calculations, but cannot 
be used to reproduce the report exactly. The abnormality flags are stored as per the HL7 standard.

For coded values, the LIMS code is stored, as well as the full text description.

Text results are stored as text. Text may comprise multiple lines, as allowed by the HL7 OBX segment. Text 
is marked with an indicator as to whether the text is a result or commentary/notes.

Dates and times of testing and reviewing are kept. Provision is made for Work Units and Cost Units in order 
to allow workload and cost calculations, but these are not used at present.

<details>
<summary>Table Details</summary>
<div class="full-table dark">

| Column Name  | Data Type | HL7 Segment | Note | 
| ------------- | ------------- | ------------- | ------------- |
| **DateTimeStamp** | datetime |  | Timestamp the record was inserted into the LDR |  | Auto |
| **Versionstamp** | varchar(30) |  | Version of the LDR Database when this record was inserted or updated. Handled by database trigger. |
| **LIMSDateTimeStamp** | datetime |  | Date and timestamp of the record from the originating LIMS. |
| **LIMSVersionStamp** | varchar(30) |  | Version of the LIMS software where this result originated. |
| **RequestID** | varchar(26) | OBX-3 | {Country(2)+LIMS(4)+LabIdentifier(20)} |
| **OBRSetID** | int | OBX-1 | RequestID and OBRSetID, OBXSetID and OBXSubID make this record unique |
| **OBXSetID** | int | OBX-4 | RequestID and OBRSetID, OBXSetID and OBXSubID make this record unique |
| **OBXSubID** | int | OBX-4 |  | The OBXSubID is used when the result requires multiple lines of text, and gives the line number.  RequestID and OBRSetID, OBXSetID and OBXSubID make this record unique |
| **LOINCCode** | varchar(30) |  | Standardized code for the analysis performed |  |  |
| **HL7ResultTypeCode** | varchar(2) | OBX-2 | Defines the data type of the value entered in the results field of the originating LIMS (LIMSRptResult field in this table) |
| **SIValue** | float |  | The SI columns are the values from the LIMSRptResult field broken down into individual components in standardized notation |
| **SIUnits** | varchar(25) |  | The SI columns are the values from the LIMSRptResult field broken down into individual components in standardized notation. |
| **SILoRange** | float |  | The SI columns are the values from the LIMSRptResult field broken down into individual components in standardized notation |
| **SIHiRange** | float |  | The SI columns are the values from the LIMSRptResult field broken down into individual components in standardized notation |
| **HL7AbnormalFlagCodes** | varchar(5) | OBX-8 |  |
| **DateTimeValue** | datetime |  | Value entered here if the result is of the type DateTime |
| **CodedValue** | varchar(1) |  | P=Positive, N=Negative, E=Equivacol |
| **ResultSemiquantitive** | int |  | 1=Semiqauntative |
| **Note** | bit |  | Indicates that the result is only a comment |
| **LIMSObservationCode** | varchar(10) |  | Code as used in the originating LIMS |
| **LIMSObservationDesc** | varchar(50) |  | Description used by the originating LIMS |
| **LIMSRptResult** | varchar(80) | OBX-5? | Result from the originating LIMS |
| **LIMSRptUnits** | varchar(25) |  | Unit of measure of result from originating LIMS |
| **LIMSRptFlag** | varchar(25) | OBX-8? | Abnormal result flagging as used in the originating LIMS |
| **LIMSRptRange** | varchar(25) |  | Range as reported on originating LIMS |
| **LIMSCodedValue** | varchar(5) |  | Coded result on originating LIMS |
| **WorkUnits** | float | OBR-23 | Additional number of technologist minutes required to perform this component of the test over and above the Workunits in the Request table |
| **CostUnits** | float |  | Additional cost to perform this component of the test over and above the Costs in the Request table |

</div>
</details>

Monitoring
-----
(*Table: Monitoring*)\
The Monitoring table has two functions. Firstly it contains the results all the organism identified by 
the Microbiology department, and if drug sensitivities were determined, it contains their results. 
This information is not stored in the result table. Secondly, it contains the results of items identified 
in the surveillance dictionaries. This information is included in the results table, but is repeated here 
for ease of reporting for surveillance requirements.

<details>
<summary>Table Details</summary>
<div class="full-table dark">

| Column Name  | Data Type | HL7 Segment | Note |
| ------------- | ------------- | ------------- | ------------- |
| **DateTimeStamp** | datetime |  | Timestamp the record was inserted into the LDR |
| **Versionstamp** | varchar(30) |  | Version of the LDR Database when this record was inserted or updated. Handled by database trigger. |
| **LIMSDateTimeStamp** | datetime |  | Date and timestamp of the record from the originating LIMS. |
| **LIMSVersionstamp** | varchar(30) |  | Version of the LIMS software where this result originated. |
| **RequestID** | varchar(26) |  | {Country(2)+LIMS(4)+LabIdentifier(20)} |  |  |
| **OBRSetID** | int | OBR-1 |  |
| **OBXSetID** | int | OBX-1 |  |
| **OBXSubID** | int | OBX-4 |  |
| **LOINCCode** | varchar(30) | OBX3 | LOINC coded identifier for analysis performed. |
| **ORGANISM** | varchar(50) | OBX-5 | Standardized name of the organism detected |
| **SurveillanceCode** | varchar(5) |  |  |
| **SpecimenDateTime** | datetime |  |  |
| **LIMSObservationCode** | varchar(25) | | Result code from the originating LIMS |
| **LIMSObservationDesc** | varchar(50) | | Result description from the originating LIMS |
| **LIMSOrganismGroup** | varchar(25) | | Organism group if identified in the originating LIMS |
| **CodedValue** | varchar(1) |  | 1=Positive, 0=Not positive |
| **ResultSemiquantitive** | int |  |  |  |  |
| **ResultNotConfirmed** | bit |  | 1=Yes, 0=No, blank =Unknown? |
| **ResistantDrugs** | varchar(250) |  | List of generic drug names ~ separated |
| **IntermediateDrugs** | varchar(250) | | List of generic drug names ~ separated |
| **SensitiveDrugs** | varchar(250) |  | List of generic drug names ~ separated |
| **MDRCode** | char(1) |  | M=MDR,X=XDR, Blanks=Not MDR |

</div>
</details>
	
Dictinary Tables
==============

Facilities and Healthcare Areas dictionaries
-----
(*Table: Facilities, HealthcareAreas*)\
The most important dictionaries of the LDR are the facilities and healthcare-area dictionaries. These 
dictionaries list all the laboratories and facilities that submit test requests to laboratories and 
classifies these facilities by type and by health-care region. A five level healthcare region is maintained 
in the Healthcare Area dictionaries to facilitate health management

<div class="no-dot">

- [x]  Country
- [x]  Province
- [x]  Region
- [x]  District
- [x]  Sub-District

</div>

This facilitates the most commonly requested management reports. In addition, the Latitude and Longitude 
(GPS coordinates) of each facility and healthcare area are recorded to allow the data to be presented 
graphically as a map using a GIS.

HL7 Codes dictionaries
-----
These dictionaries provide descriptions for all the coded fields derived from the HL7 standard. They 
include descriptions for abnormal flags, patient classes, results type and status and specimen sites and sources.

***HL7 Tables***:
<div class="no-dot">

- [x]  HL7AbnormalFlagCodes
- [x]  HL7EthnicGroupCodes
- [x]  HL7PatientClassCodes
- [x]  HL7ResultStatusCodes
- [x]  HL7ResultTypeCodes
- [x]  HL7SectionCodes
- [x]  HL7SexCodes
- [x]  HL7SpecimenSiteCodes
- [x]  HL7SpecimenSourceCodes

</div>

LOINC dictionary
-----
(*Table: LOINC*)\
The complete LOINC data set is maintained as an OpenLDR dictionary. This can be used for standardized naming, 
and to look up other aspects of laboratory tests provided by LOINC.

OpenLDR code dictionaries
-----
(*Table: MDRCodes*)\
These dictionaries provide descriptions for all the coded fields used by OpenLDR that are not derived from 
the HL7, LOINC or SI standards. They include descriptions for multi-drug-resistant flags (MDRs).

Surveillance dictionary
-----
(*Table: Surveillance*)\
This dictionary defines the items that are used to provide surveillance reports using data from the monitoring data.

Analyzer dictionary
-----
(*Table: Analyzers*)\
This dictionary contains a list of all analyzers, including the manufacturer, serial number and date of 
installation - used for reports related to laboratory equipment.
