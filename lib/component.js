var Component = function(data){
  this.name = data.name;
  this.avgPrice = data.avg;
  this.rawAverage = data.comp_val_rt;
  this.data = data.data;
}

Component.prototype.toString = function(){
  return "\u221F " + padName(this.name) + " | average: "+ (this.avgPrice !== ""  ? this.avgPrice : "0p");
}

var padName = function(locationString){
  if(locationString.length < "Neuroptics".length){
    return padName(locationString + " ");
  } else {
    return locationString;
  }
}

module.exports = Component;