//!*script
/**
 * Benchmark
 *
 */

'use strict';

/* Initial */
const st = PPx.CreateObject('ADODB.stream');
let module = function (filepath) { st.Open; st.Type = 2; st.Charset = 'UTF-8'; st.LoadFromFile(filepath); const data = st.ReadText(-1); st.Close; return Function(' return ' + data)(); };
const test = module(PPx.Extract('%*getcust(S_ppm#plugins:ppm-test)\\script\\jscript\\mod_test.js'));
module = null;

/* Test code */

const LOOP_COUNT = 10000;

test.benchmark('measure', LOOP_COUNT, function () {
  // edit here!
  let a, b, c;


  test.measure('test1', function () {
    if (a === 0) {
      c = 1;
    }
  });
  test.measure('test2', function () {
    if (b === '0') {
      c = 1;
    }
  });
  // test.measure('test3', function () {
  // })
});

/**
 * test.measure(description, callback) - benchmark test item
 *
 * @param {string} description
 * @param {function} callback
 *
 * > test.measure('benchmark1', function () {
 *     some kind of process
 *   })
 */
