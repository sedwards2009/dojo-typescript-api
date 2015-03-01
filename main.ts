/// <reference path="typings/tsd.d.ts" />

import fs = require('fs');

import generator = require('./generator');
import DojoDetailsInterface = require('./DojoDetailsInterface');

/*const DETAILS_FILENAME = 'data/details-1.10.json';*/
const DETAILS_FILENAME = 'data/small-details-1.10.json';

function main() {
  console.log("Reading ", DETAILS_FILENAME);
  const details: DojoDetailsInterface.DojoDetailsInterface = <DojoDetailsInterface.DojoDetailsInterface> JSON.parse(fs.readFileSync(DETAILS_FILENAME, 'utf8'));
  console.log(generator.formatAPI(details));
}
main();
