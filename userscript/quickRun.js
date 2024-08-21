//!*script
/* @file Running scripts for testing purposes
 * @fileoverview
 * いくつかのオブジェクトを使用可能
 * - fso(Scripting.FileSystemObject)
 * - ppm(PPxオブジェクトのラッパー。詳細はppedevを参照)
 * - test(テスト用ヘルパーオブジェクト)
 *
 * @desc PPx.report()を実行。PPb[T]が起動中はそちらに*linemessageを送ります
 * @param ppxid {string} 実行するPPxのIDを指定。"."を指定するとカレントIDで実行されます
 * @param value {any}    文字列、数値、配列、オブジェクトを渡せます
 * test.print(ppxid, value) => void
 * > test.print('V','%n')
 *
 * @desc 一時テーブルに追加するプロパティ
 * @param key   {string} プロパティ名を指定
 * @param value {string} プロパティの内容を記述
 * test.tableItem(key, value) => void
 *
 * @desc 一時的なテーブルを生成し実行
 * @param att      {'E'|'M'|'K'} 生成テーブルを指定。E=拡張子、M=メニュー、 K=キー
 *                  'K'を指定したときは、ESCキーで設定を削除できます
 * @param callback {Function}    一時テーブルを生成する関数。test.tableItem()を記述
 * test.table(att, callback) => void
 * > test.table('E', function() {
 * >   test.tableItem(':BMP', '*linemessage %R is a bitmap file')
 * >   test.tableItem('BMP', '*linemessage %R is not a bitmap file')
 * > })
 */

PPx.Include(PPx.Extract('%sgu"ppmcache"\\userscript\\_testHelper.js'));

/* ここから */

