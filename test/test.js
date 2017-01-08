const WFNQ = require('../index.js');
const nexus = new WFNQ();

const querystring = 'Vauban Prime';
const query = nexus.priceCheckQueryAttachment(querystring);

query.then((items) => {
  console.log(items);
}).catch((error) => {
  throw error;
});
