/// <reference path="typings/tsd.d.ts" />
"use strict";
import fs = require('fs');
import shelljs = require('shelljs');
import path = require('path');

import generator = require('./generator');
import DojoDetailsInterface = require('./DojoDetailsInterface');

const DETAILS_FILENAME = 'data/details-1.10.json';
const OUTPUT_DIR = "output";

function main() {

  if(shelljs.test('-e', OUTPUT_DIR)) {
    shelljs.rm("-rf", OUTPUT_DIR);
  }
  shelljs.mkdir(OUTPUT_DIR);

  console.log("Reading ", DETAILS_FILENAME);

  const details: DojoDetailsInterface.DojoDetailsInterface = <DojoDetailsInterface.DojoDetailsInterface> JSON.parse(fs.readFileSync(DETAILS_FILENAME, 'utf8'));

  const prefixes: Set<string> = new Set<string>();
  prefixes.add("dojo");
  prefixes.add("doh");
  prefixes.add("dijit");

  for(let key in details) {
    if (key.indexOf("dojox/") === 0) {
      let prefix = key.split(/\//g).slice(0,2).join("/").split(/\./g)[0];
      prefixes.add(prefix);
    }
  }

  prefixes.forEach( (prefix) => {
      console.log("Processing " + prefix);
      const cleanDetails: DojoDetailsInterface.DojoDetailsInterface = {};
      for(let key in details) {
        if (key.indexOf(prefix) === 0 && (key.length === prefix.length || key[prefix.length] === '/')) {
          cleanDetails[key] = details[key];
        }
      }
      const filename = path.join(OUTPUT_DIR, prefix.replace(/\//g, ".") + ".d.ts");
      fs.writeFileSync(filename, generator.formatAPI(cleanDetails), { encoding: "utf8" });
    });

  console.log("\nDone");
}
main();
