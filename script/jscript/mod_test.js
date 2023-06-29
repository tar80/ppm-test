(function () {
  var NL_CHAR = NL_CHAR || '\r\n';
  var logview = PPx.Extract('%*getcust(X_combos)').slice(28, 29) === '1';
  var use_ppb = PPx.Extract('%NBT') !== '';
  var log_cmd = use_ppb ? '*execute BT,*linemessage ' : '*linemessage ';
  var testlog = (function () {
    if (!logview && !use_ppb) {
      var logger = PPx.Extract(
        '%*choice("Log window is required to view logs. Choices,%bn' +
          'Yes: Open Log-window%bn' +
          'No: Launch PPb[T] to view logs"' +
          ' -title:"ppm-test" -type:yNc -cancelstop)'
      );
      if (logger === '2') {
        PPx.Execute('*ppb -bootid:t%:*wait 1000,2');
        use_ppb = true;
      } else if (logger === '1') {
        PPx.Execute('%M?layoutmenu,!G');
      } else {
        PPx.Quit(1);
      }
    }
    return use_ppb
      ? function (msg) {
          PPx.Execute('*execute BT,*linemessage ' + msg.replace(RegExp(NL_CHAR, 'g'), '%%bn'));
        }
      : function (msg) {
          PPx.SetPopLineMessage(msg);
        };
  })();
  var sort_ppx_process = (function () {
    var processID = PPx.WindowIDName.slice(0, 1);
    return function (ppxid) {
      return ppxid !== processID && /[BCV~]/.test(ppxid.toUpperCase());
    };
  })();
  var extract = function (ppxid, macro) {
    return sort_ppx_process(ppxid)
      ? PPx.Extract('%*extract(' + ppxid + ',"%(' + macro + '%)")')
      : PPx.Extract('%*extract("' + macro + '")');
  };
  var test = {};
  var obj_extract = function (obj) {
    var ary = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (obj[key]) {
          var value = typeof(obj[key]) === 'string' ? '"' + obj[key] + '"' : obj[key];
          ary.push(key + ':' + value);
        }
      }
    }
    return '{ ' + ary.join(', ') + ' }';
  };
  test.print = function (ppxid, msg) {
    var type = (function (m) {
      if (m === null) {
        return 'null';
      }
      return typeof m;
    })(msg);
    var value = type === 'object' ? obj_extract(msg) : extract(ppxid, msg);
    return testlog('[test-print]' + NL_CHAR + 'type:\t' + type + NL_CHAR + 'value:\t' + value);
  };
  var bench_details = {};
  var bench_do = function (count, callback) {
    var startAt = new Date();
    for (var i = 0; i < count; i++) callback();
    return (new Date() - startAt) / 1000;
  };
  test.measure = function (subject, callback) {
    return (bench_details[subject] = callback);
  };
  test.benchmark = function (title, count, obj) {
    bench_details = {};
    obj();
    bench_do(1000, function () {
      1 + 1;
    });
    testlog('Running ' + title + '...');
    for (var key in bench_details) {
      if (Object.prototype.hasOwnProperty.call(bench_details, key)) {
        var resultTime = bench_do(count, bench_details[key]);
        testlog(resultTime + '\t#' + key + ': ' + bench_details[key]());
      }
    }
    testlog('Finish.');
  };
  var menu_obj = {};
  var menu_suite = function (type) {
    if (!/[ekm]/i.test(type)) {
      PPx.Echo('Incorrect type specification.' + NL_CHAR + 'Allow menu range is E, K, M');
      PPx.Quit(1);
    }
    return type.toUpperCase() + '_ppmTemp';
  };
  test.menuCreate = function (type, menu, obj) {
    var menuArr = [];
    var delim = {E: ',', K: ',', M: '='}[type.toUpperCase()];
    menu_obj = {};
    menuDelete(type);
    obj();
    for (var item in menu_obj) {
      if (Object.prototype.hasOwnProperty.call(menu_obj, item)) {
        menuArr.push('*setcust ' + menu + ':' + item + delim + menu_obj[item]);
      }
    }
    PPx.Execute(menuArr.join('%:'));
  };
  test.menuItem = function (key, value) {
    menu_obj[key] = value;
  };
  var menuDo = function (type) {
    type = type.toUpperCase();
    var exec = {
      E: function () {
        PPx.Execute('%ME_ppmTemp');
      },
      K: function () {
        PPx.Execute(
          '*setcust K_ppmTemp:ESC,*mapkey delete,K_ppmTemp%%:*deletecust "K_ppmTemp"%%:' +
            log_cmd +
            '* deleted *'
        );
        PPx.Execute('*mapkey use,K_ppmTemp');
        testlog('[test-menu]' + NL_CHAR + 'Esc-key to delete temp menu');
      },
      M: function () {
        PPx.Execute('%M_ppmTemp');
      }
    };
    exec[type]();
  };
  var menuDelete = function (menu) {
    PPx.Execute('*deletecust "' + menu + '"');
  };
  test.menu = function (menu_type, callback) {
    var menu = menu_suite(menu_type);
    test.menuCreate(menu_type, menu, function () {
      callback();
    });
    menuDo(menu_type);
    if (menu_type.toUpperCase() !== 'K') menuDelete(menu);
  };
  return test;
})();
