var Component = function(data){
  this.name = data.name;
  this.avgPrice = data.avg;
  this.rawAverage = data.comp_val_rt;
  this.data = data.data;
}

Component.prototype.toString = function(){
  return "\u221F " + this.name + " | average: "+this.avgPrice;
}

module.exports = Component;