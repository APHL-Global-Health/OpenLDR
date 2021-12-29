Open Laboratory Data Repository
======

![](/doc/assets/images/version.svg) ![](/doc/assets/images/license.svg) ![](/doc/assets/images/database_platforms.svg)

The OpenLDR provides a single storage location for the country-wide electronic data regarding laboratory 
requests and results. This allows laboratory systems managers to easily view relevant data on the entire 
country, different geographic levels or detailed data down to the lab and section. A major design goal of 
the OpenLDR is to accommodate data from laboratories which use disparate Laboratory Information Management 
Systems (LIMS). The OpenLDR defines a simple, easy to understand data model in order to simplify the 
merging of data, data analysis and the creation of report templates. The OpenLDR design specification can 
be implemented utilizing any relational database. While the design is “open” the data is not and is 
expected to be securely hosted by the aggregating organization (e.g. Ministry of Health).



- [x]  Drug susceptibility rates
- [x]  Viral Load suppression rates
- [x]  Early Infant Diagnosis results
- [x]  Laboratory workload by laboratory section and instrument
- [x]  Turn Around Times
- [x]  Demographic breakdowns for system use and test outcomes
- [x]  Geographic sample collection versus testing locations



Management Tool Will Focused On 
-----

- [x]  Database design
- [x]  Deployments
- [x]  Migrations
- [x]  Administration
- [x]  Query optimization
- [x]  Stored procedures
- [x]  Triggers
- [x]  Views
- [x]  Visualization/Reports
- [x]  APIs



Setting Up Environment
-----
Before you get started, you’ll need a couple of things:

Runtime Environment
- [x]  Node.js version 8.0 or higher

At Least One Database Engine
- [x]  Microsoft SQL
- [x]  MongoDB
- [ ]  MySQL
- [ ]  Postgres
- [ ]  SQLite

-----

Management Tool Structure
==============
```nohighlight:
.
├── api
│   └── projects
│      └── openldr
│         ├── certs
│         :   └── ...
│         ├── src
│         │   ├── data
│         │   │    └── db
│         │   │        ├── mongodb
│         │   │        :
│         │   :        ├── mssql
│         │   │        :
│         │   │        └── ...
│         │   ├── libraries
:         :   :      └── ...
│         │   ├── plugins
│         │   │      └── plugin name
│         │   :            ├── config.json
│         │   │            └── plugin.js
│         │   ├── routes
│         │   :      └── ...
│         │   ├── views
│         │   :      └── ...
│         │   ├── config.js
│         │   └── index.js
│         └── .env
├── doc
:   └── ...
├── ui
│    ├── certs
│    :	  └── ...
│    ├── components
│    :	  └── ...
│    ├── lib
│    :	  └── ...
│    ├── public
│    │	  ├── css
│    │	  :    └── ...
│    │	  ├── fonts
:    :	  :    └── ...
│    │	  ├── img
│    │	  :    └── ...
│    │	  └── script
│    │          └── ...
│    ├── routes
│    :	  └── ...
│    ├── .env
│    ├── config.js
│    └── index.js
└── package.json
```

Managing Configuration
==============
Before the tool can provide means to interact with database engines and users,
we need a good way to manage tool’s configuration, such as database connection information.
Using a `.env` configuration file to set environment variables and validating those variables 
in the `config.js` file.

When using a source control system such as git, do not add the .env 
file to source control. Each environment requires a custom .env file and may contain secrets that 
should not be stored in a repository. The following example `.env` configuration is the recommended variables expected 
for the tool to work located `api> projects > openldr > .env`.

```
PROXIES='openldr'

PROJECT_ID=openldr
PROJECT_NAME=Open Laboratory Data Repository
PROJECT_LOCATION=af-east-1

HTTP_PORT=5087
HTTPS_PORT=5443

ACCESS_TOKEN_SECRET=fake23hj123dd
ACCESS_TOKEN_LIFE=86400
REFRESH_TOKEN_SECRET=faketokensecretmmakhanjkajikhiwn2n
REFRESH_TOKEN_LIFE=86400

ACCESS_TOKEN_EMAIL=temp.user@fake.com
ACCESS_TOKEN_PASSWORD=faketoken123$$$
CRYPTO_ALGORITHM=aes-256-ctr
CRYPTO_KEY=fakekeympNWjRRIqCc7rdxs01lwHzfr3
CRYPTO_IV=fakeiv1mpNWjRRIqCc7rdxs01lwHzfr3

HTTPS_PFX=/certs/server.pfx
HTTPS_PASSPHRASE=fake_pass_phrase

DB_URI='Server=localhost,1433;User Id=fake_user;Password=fake_password;Encrypt=false;TrustServerCertificate=True;request timeout=180000;'
DB_DRIVER=mssql
DB_DATA=OpenLDRData
DB_DICT=OpenLDRDict
```

The ui also has its own `.env` and here is an example configuration with recommended variables.
It's located `ui> .env`.

```
HTTP_PORT=7087
HTTPS_PORT=7443

ACCESS_TOKEN_SECRET=fake23hj123dd
ACCESS_TOKEN_LIFE=86400
REFRESH_TOKEN_SECRET=faketokensecretmmakhanjkajikhiwn2n
REFRESH_TOKEN_LIFE=86400

ACCESS_TOKEN_EMAIL=temp.user@fake.com
ACCESS_TOKEN_PASSWORD=faketoken123$$$
CRYPTO_ALGORITHM=aes-256-ctr
CRYPTO_KEY=fakekeympNWjRRIqCc7rdxs01lwHzfr3
CRYPTO_IV=fakeiv1mpNWjRRIqCc7rdxs01lwHzfr3

HTTPS_PFX=/certs/server.pfx
HTTPS_PASSPHRASE=fake_pass_phrase
```

## Install

Download the source from [here](https://github.com/APHL-Global-Health/OpenLDR) or git clone like

`git clone https://github.com/APHL-Global-Health/OpenLDR.git`

Navigate to `OpenLDR` directory and download the dependencies required using npm like

`npm i`

There are several ways of starting the tool, the prefered methods are

`npm run start:all` or  `npm run start:openldr`

## Documentation

For full documentation about OpenLDR, visit [openldr.org](http://openldr.org/)

## Community & Support

- [Community Forum](https://github.com/APHL-Global-Health/OpenLDR/discussions). Best for: help with building, discussion about best practices.
- [GitHub Issues](https://github.com/APHL-Global-Health/OpenLDR/issues). Best for: bugs and errors you encounter.

## Status

- [x] Public Alpha: Testing with a closed set of parties
- [ ] Public Beta: Stable enough for most non-enterprise use-cases
- [ ] Public: Production-ready

We are currently in Public Alpha. Watch "releases" of this repo to get notified of major updates.
