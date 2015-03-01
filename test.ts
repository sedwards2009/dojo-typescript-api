/// <reference path="typings/tsd.d.ts" />
"use strict";

import fs = require('fs');
import path = require('path');
import child_process = require('child_process');
import shelljs = require('shelljs');

import generator = require('./generator');
import DojoDetailsInterface = require('./DojoDetailsInterface');

const DETAILS_FILENAME = 'data/details-1.10.json';
const details = readDetails(DETAILS_FILENAME);
const TMP_DIR = "target/tmp";
const HEADER_FILENAME = "header.d.ts";
const CODE_FILENAME = "code.ts";
function setup(): void {
  if(shelljs.test('-e', TMP_DIR)) {
    shelljs.rm("-rf", TMP_DIR);
  }
  shelljs.mkdir(TMP_DIR);
}

function readDetails(filename: string): DojoDetailsInterface.DojoDetailsInterface {
  const details: DojoDetailsInterface.DojoDetailsInterface = <DojoDetailsInterface.DojoDetailsInterface> JSON.parse(fs.readFileSync(filename, 'utf8'));
  return details;
}

function tsCompile(headerText: string, codeText: string): void {
  fs.writeFileSync(path.join(TMP_DIR, HEADER_FILENAME), headerText, { encoding: "utf8"});

  const completeCode = `/// <reference path="./${HEADER_FILENAME}" />\n${codeText}`;
  fs.writeFileSync(path.join(TMP_DIR, CODE_FILENAME), completeCode, { encoding: "utf8"});
  try {
    child_process.execSync(`tsc --target es6 --module commonjs --outDir ${TMP_DIR} ${path.join(TMP_DIR, CODE_FILENAME)}`);
  } catch(e) {
    console.log(formatChildProcessError(e));
  }
}

function formatChildProcessError(err: {stdout: Buffer[]}): string {
  return "Error:\n" + err.stdout.toString();
}

function testDojoString() {
  var textDetails: DojoDetailsInterface.DojoDetailsInterface = {};
  textDetails["dojo/string"] = details["dojo/string"];


  const headerText = generator.formatAPI(textDetails);

  tsCompile(headerText, `
  import dojoString = require("dojo/string");

`);
}

setup();
testDojoString();
