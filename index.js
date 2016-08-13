var maxCacheLength = process.env.NEXUSSTATS_MAX_CACHE_LENGTH || 60000;

var Parser = function () {
  this.cache = null;
  this.lastRefresh = null;
  this.refreshing = false;
  this.refreshQueue = [];
}

Parser.prototype.dataIsCurrent = function() {
  return this.cache &&
     Date.now() - this.cache.creation < MAX_CACHED_TIME
}

Parser.prototype.getData = function(callback) {
  if(this.dataIsCurrent()) {
    callback(null, this.cache);
  } else {
    this.refresh(callback);
  }
}

Parser.prototype.refresh = function(callback) {
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

Parser.prototype.retrieve = function(callback) {
  var url = platformURL[this.platform];
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
    callback(null, new WorldState(data, self.platform));
  });
}

Parser.prototype.processRefreshQueue = function(err, data) {
  while(this.refreshQueue.length) {
    this.refreshQueue.shift()(err, data);
  }
}

var refresh = function(callback){
  // Use connect method to connect to the Server 
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    cache = db.getCollection('Itemcache');
    db.close();
  });
  callback(null, cache);
}

var WarframeNexusStats = function(){
  this.cache = undefined;
  if(cache === {}){
    var self = this;
    refresh(function(err, dataCache){
      if(err){
        console.error(err);
        return;
      }
      self.cache = dataCache;
    });
  }
  this.creation = new Date();
}

WarframeNexusStats.prototype.refresh = function(callback){
  var self = this;
  if(Date.now() - this.creation.getDate()){
    
  }
  refresh(function(err, dataCache){
    if(err){
      console.error(err);
      return;
    }
    self.creation = new Date();
    self.cache = dataCache;
  });
}

WarframeNexusStats.prototype.getItemValues = function(callback){
  this.refresh(function(err, dataCache){
    if(err){
      console.error(err);
      return;
    }
    else{
      callback(null, JSON.stringify(dataCache))
    }      
  });
}

module.exports = WarframeNexusStats;