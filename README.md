# warframe-nexus-query

A node project for allowing simple access to the `https://nexus-stats.com/` api.

## Installation
```
npm install --save warframe-nexus-query
```

## Usage

Require | Module File | Accessor | Description | parameters
--- | --- | --- | --- | ---
`warframe-nexus-query` | `index.js` | `.priceCheckQueryString` | Get Query result string | `query`, `callback`
`warframe-nexus-query` | `index.js` | `.priceCheckQuery` | Get Query result objects, has more parameters available | `query`, `callback`


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