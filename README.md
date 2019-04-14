# warframe-nexus-query

[![Supported by Warframe Community Developers](https://warframestat.us/wfcd.png)](https://github.com/Warframe-Community-Developers "Supported by Warframe Community Developers")

A node project for allowing simple access to the `https://nexushub.co/` api.

## Get Help on Discord

[![Contact me on Discord](https://img.shields.io/badge/discord-Tobiah%230001-7289DA.svg)](https://discord.gg/jGZxH9f "Contact me on Discord: Tobiah#0001")

## Metrics

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/93c7b05147124147acb64c7117dc87b1)](https://www.codacy.com/app/wfcd/warframe-nexus-query?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=WFCD/warframe-nexus-query&amp;utm_campaign=Badge_Grade)
[![Build Status](https://travis-ci.com/WFCD/warframe-nexus-query.svg?branch=master)](https://travis-ci.com/WFCD/warframe-nexus-query)

## Installation
```
npm install --save warframe-nexus-query
```

## Usage

Require | Module File | Accessor | Description | parameters
--- | --- | --- | --- | ---
`warframe-nexus-query` | `index.js` | `.priceCheckQueryString` | Get Query result string | `query`, `callback`
`warframe-nexus-query` | `index.js` | `.priceCheckQuery` | Get Query result objects, has more parameters available | `query`, `callback`

## Environment variables

Variable | example | default
--- | --- | ---
`NEXUSSTATS_MAX_CACHED_TIME` | `600000` | `30000`
`NEXUSSTATS_URL_OVERRIDE` | `'https://nexus-stats.com/api'` | `https://nexus-stats.com/api`

## Objects

Item

* `components` - List of component objects
* `id` - Unique identifier for the Item object
* `title` - Title of the item
* `type` - Type of the item
* `supplyPercent` - Of the total amount of item listings for this object, this is the percent for sale
* `demandPercent` - Of the total amount of item listings for this object, this is t looking to be bought
* `supplyAmount`  - Of the total amount of item listings for this object, this is the number for sale
* `demandAmount`  - Of the total amount of item listings for this object, this is the number looking to be bought

Component

* `name` -  Name of the component
* `avgPrice` - Average platinum price
* `rawAverage` - Raw average (non-rounded) price of the component
* `data` - Array of Miscellaneous data
