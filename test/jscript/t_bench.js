//!*script
/**
 * Benchmark
 *
 */

/* Initial */
var st = PPx.CreateObject('ADODB.stream');
var module = function (filepath) { st.Open; st.Type = 2; st.Charset = 'UTF-8'; st.LoadFromFile(filepath); var data = st.ReadText(-1); st.Close; return Function(' return ' + data)(); };
var util = module(PPx.Extract('%*getcust(S_ppm#global:module)\\util.js'));
var test = module(PPx.Extract('%*getcust(S_ppm#plugins:ppm-test)\\script\\jscript\\mod_test.js'));
module = null;


/* Test code */

var LOOP_COUNT = 10000;

test.benchmark('measure', LOOP_COUNT, function () {
  // edit here!
  var a, b, c;


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
