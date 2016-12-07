const WFNQ = require('../index.js');
const nexus = new WFNQ();

let querystring = "Vauban Prime";
let query = nexus.priceCheckQueryAttachment(querystring);

query.then(items => {
	console.log(items);
}).catch((error) => {
	throw error;
});
