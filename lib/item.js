var md = require('node-md-config');
var Component = require('./component.js');

var Item = function(data){
  this.components = [];
  this.id = data.id;
  this.title = data.Title;
  this.type = data.Type;
  this.supplyPercent = safeGetAmountString(data.SupDem[0]);
  this.demandPercent = safeGetAmountString(data.SupDem[1]);
  this.supplyAmount =  safeGetAmountString(data.SupDemNum[0]);
  this.demandAmount =  safeGetAmountString(data.SupDemNum[1]);
  self = this;
  data.Components.forEach(function(componentData){
    self.components.push(new Component(componentData));
  });
}

Item.prototype.toString = function(){
  var componentString = md.codeMulti+this.title+md.lineEnd
    +"　"+"Supply: "+this.supplyAmount + " units - "+this.supplyPercent+"%"+md.lineEnd
    +"　"+"Demand: "+this.demandAmount + " units - "+this.demandPercent+"%"+md.lineEnd+"　　";
  for(i = 0; i < this.components.length; i++){
    componentString += this.components[i].toString() + (i<this.components.length-1 ? ","+md.lineEnd+"　　" : "");
  }
  
  return componentString+md.blockEnd;    
}

var safeGetAmountString = function(checkThing){
  return typeof checkThing !== 'undefined' ? checkThing : "0";
}
module.exports = Item;