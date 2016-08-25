var request = require('request');
var maxCacheLength = process.env.NEXUSSTATS_MAX_CACHED_TIME || 60000;
var Item = require('./lib/item.js');
var md = require('node-md-config');
var jsonQuery = require('json-query');

var WarframeNexusStats = function () {
  this.cache = null;
  this.lastRefresh = null;
  this.refreshing = false;
  this.refreshQueue = [];
}

WarframeNexusStats.prototype.dataIsCurrent = function() {
  return this.cache &&
     Date.now() - this.cache.creation < maxCacheLength
}

WarframeNexusStats.prototype.getData = function(callback) {
  if(this.dataIsCurrent()) {
    callback(null, this.cache);
  } else {
    this.refresh(callback);
  }
}

WarframeNexusStats.prototype.refresh = function(callback) {
  var self = this;

  this.refreshQueue.push(callback);
  if(!this.refreshing) {
    this.refreshing = true;

    this.retrieve(function(err, data) {
      if(!err) {
        self.cache = data;
        self.lastRefresh = Date.now();
      }
      self.refreshing = false;
      self.processRefreshQueue(err, data);
    });
  }
}

WarframeNexusStats.prototype.retrieve = function(callback) {
  var url = 'https://nexus-stats.com/api';
  var self = this;
  request.get(url, function(err, response, body) {
    if(err) {
      return callback(err);
    }
    if(response.statusCode !== 200) {
      var error
      error = new Error(url + ' returned HTTP status ' + response.statusCode)
      return callback(error);
    }
    var data

    try {
      data = JSON.parse(body);
    } catch(e) {
      data = null;
    }

    if(!data) {
      var error
      error = new Error('Invalid JSON from ' + url);
      return callback(error);
    }
    var wrappedData = {
      items: data
    }
    callback(null, wrappedData);
  });
}

WarframeNexusStats.prototype.processRefreshQueue = function(err, data) {
  while(this.refreshQueue.length) {
    this.refreshQueue.shift()(err, data);
  }
}

WarframeNexusStats.prototype.priceCheckQuery = function(query, callback){
  this.getData(function(err, dataCache){
    if(err) {
      return callback(err, null);
    }
    var results = jsonQuery('items[*Title~/'+query+'/i]', {
      data: dataCache,
      allowRegexp: true
    });
    var componentsToReturn = [];
    if(typeof results.value === 'undefined'){
      callback(new Error("No value for given query - WarframeNexusStats.prototype.priceCheckQuery", "warframe-nexus-query/index.js", 88), null);
      return;
    }

    results.value.slice(0, 4).forEach(function(item){
      componentsToReturn.push(new Item(item));
    })
    callback(null, componentsToReturn);
  })
}

WarframeNexusStats.prototype.priceCheckQueryString = function(query, callback){
  this.getData(function(err, dataCache){
    var defaultString = md.codeMulti+"Operator, there is no such item pricecheck available."+md.blockEnd;
    if(err) {
      return callback(err, defaultString);
    }
    var results = jsonQuery('items[*Title~/'+query+'/i]', {
      data: dataCache,
      allowRegexp: true
    });
    if(typeof results.value === 'undefined'){
      callback(new Error("No value for given query - WarframeNexusStats.prototype.priceCheckQueryString"
                         , "warframe-nexus-query/index.js", 111), null);
      return;
    }
    var componentsToReturn = [];
    results.value.forEach(function(item){
      componentsToReturn.push(new Item(item));
    });
    
    var componentsToReturnString = "";
    componentsToReturn.slice(0,4).forEach(function(component){
      componentsToReturnString += md.lineEnd + component.toString();
    });
    componentsToReturnString = componentsToReturn.length > 0 ? 
                                  componentsToReturnString : 
                                  defaultString;
    callback(null, componentsToReturnString);
  });
}

module.exports = WarframeNexusStats;