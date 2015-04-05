/// <reference path="typings/tsd.d.ts" />
"use strict";

// Unittests for use with nodeunit https://github.com/caolan/nodeunit

import nodeunit = require('nodeunit');
import child_process = require('child_process');
import shelljs = require('shelljs');

import generate_all = require('./generate_all');
import generator = require('./generator');

// Utility functions.

// const DETAILS_FILENAME = 'data/details-1.10.json';
const TMP_DIR = "target/tmp";
// const HEADER_FILENAME = "header.d.ts";
// const CODE_FILENAME = "code.ts";

generate_all.main();

// Clean tmp before each test.
export function setUp(callback: Function): void {
  if(shelljs.test('-e', TMP_DIR)) {
    shelljs.rm("-rf", TMP_DIR);
  }
  shelljs.mkdir(TMP_DIR);
  

  callback();
}

function testCompile(filename: string): boolean {
  try {
    child_process.execSync(`tsc --target es6 --module commonjs --outDir ${TMP_DIR} ${filename}`);
  } catch(e) {
    console.log(formatChildProcessError(e));
    return false;
  }
  return true;
}

function formatChildProcessError(err: {stdout: Buffer[]}): string {
  return "Error:\n" + err.stdout.toString();
}

//-------------------------------------------------------------------------
// Tests begin here.

export function testReturnTypePromise(test: nodeunit.Test): void {
  test.equal(generator.formatType("dojo/promise/Promise"), "dojo.promise.Promise");
  test.done();
}

export function testNormalizeDash(test: nodeunit.Test): void {
  test.equal(generator.normalizeName("dojo/dom-attr"), "dojo.dom_attr");
  test.done();
}

export function testCompileDateStamp(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/date_stamp.ts") );
  test.done();
}

export function testCompileDojoDateLocale(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/date_locale.ts") );
  test.done();
}

export function testCompileDojoStoreDatastore(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/dojo_store_datastore.ts") );
  test.done();
}

export function testCompileDojo_BaseLang(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/dojo__base_lang.ts") );
  test.done();
}

export function testCompileDojoStoreMemory(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/dojo_store_memory.ts") );
  test.done();
}

export function testCompileDijitEmpty(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/dijit_empty.ts") );
  test.done();
}

export function testCompileDohEmpty(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/doh_empty.ts") );
  test.done();
}

export function testCompileDojoOn(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/dojo_on.ts") );
  test.done();
}

export function testCompileDijitDateTextBox(test: nodeunit.Test): void {
  test.ok( testCompile("test_files/dijit_DateTextBox.ts") );
  test.done();
}
