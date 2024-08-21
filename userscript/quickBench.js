//!*script
/* @file Running scripts for benchmarking
 * @fileoverview
 * いくつかのオブジェクトを使用可能
 * - fso(Scripting.FileSystemObject)
 * - ppm(PPxオブジェクトのラッパー。詳細はppedevを参照)
 * - test(テスト用ヘルパオブジェクト)
 *
 * @desc ベンチマークの対象となるコードを記述
 * @param subject  {string}   件名
 * @param callback {Function} 実行するコードを記述
 * test.measure(subject, callback) => void
 *
 * @desc ベンチマークを実行
 * @param desc    {string}   ベンチマークの説明
 * @param count   {number}   コードの実行回数
 * @param session {Function} 関数内にtest.measure()を記述
 * test.benchmark(desc, count, session) => void
 * > test.benchmark('regexp speed', 1000, function() {
 * >   var value = '01234,abcde'
 * >   var rgx = '^(\\d+),.+$';
 * >
 * >   test.measure('script', function(){
 * >     return value.replace(Regexp(rgx), '$1');
 * >   })
 * >   test.measure('cmd', function(){
 * >     return PPx.Extract('%*regexp("' + value + '","s/' + rgx + '/$1/")')
 * >   })
 * > })
 */

PPx.Include(PPx.Extract('%sgu"ppmcache"\\userscript\\_testHelper.js'));

/* ここから */
var desc = '';
var count = 1000;

test.benchmark(desc, count, function() {
  var result;

  test.measure('bench1', function(){
    return result;
  })
  test.measure('bench2', function(){
    return result;
  })
})
