//!*script
/**
 * Test
 *
 */

/* Initial */
const st = PPx.CreateObject("ADODB.stream");
let module = function (filepath) { st.Open; st.Type = 2; st.Charset = "UTF-8"; st.LoadFromFile(filepath); const data = st.ReadText(-1); st.Close; return Function(" return " + data)(); };
const test = module(
  PPx.Extract("%*getcust(S_ppm#plugins:ppm-test)\\script\\jscript\\mod_test.js")
);
module = null;

'use strict';

// Edit here



/**
 * test.print(winid, value) - Print value in log window or PPb[T]
 *
 * @param {string} winid - PPx window. C | V | B | ~
 * @param {any} expand value
 *
 * > test.print('C', '%n')
 */

/**
 * test.menu(menu_type, callback) - Create temp menu and do it
 *
 * @param {string} menu_type - K(key) | E(ext) | M(menu)
 * @param {function} callback - menu items
 *
 * test.menuItem(field, value) - Create temp menu item
 *
 * @param {string} field - item name
 * @param {string} value - item value
 *
 * > test.menu('K',() =>{
 * >   test.menuItem('a', '*linemessage %n')
 * >   test.menuItem('b', '*linemessage %N')
 * > })
 */

