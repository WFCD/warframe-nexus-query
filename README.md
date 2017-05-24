# warframe-nexus-query

[![Supported by Warframe Community Developers](https://raw.githubusercontent.com/WFCD/banner/master/banner.png)](https://github.com/WFCD "Supported by Warframe Community Developers")

A node project for allowing simple access to the `https://nexus-stats.com/` api.

## Get Help on Discord

[![Contact me on Discord](https://img.shields.io/badge/discord-Tobiah%238452-7289DA.svg)](https://discord.gg/0ycgfahdR8gTzWgM "Contact me on Discord: Tobiah#8452")


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
