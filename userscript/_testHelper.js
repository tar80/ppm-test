if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/, '');
  };
}
if (!Object.keys) {
  Object.keys = (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !{
        toString: null
      }.propertyIsEnumerable('toString'),
      dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
      dontEnumsLength = dontEnums.length;
    return function (obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj == null)) {
        throw new Error('Object.keys: called on non-object');
      }
      var result = [];
      var prop;
      var i;
      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }
      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  })();
}
var info = {
  ppmName: 'ppx-plugin-manager',
  ppmVersion: 0.95,
  language: 'ja',
  encode: 'utf16le',
  nlcode: '\r\n',
  nltype: 'crlf',
  ppmID: 'P',
  ppmSubID: 'Q'
};
var uniqName = {
  initialCfg: '_initial.cfg',
  globalCfg: '_global.cfg',
  nopluginCfg: '_noplugin.cfg',
  pluginList: '_pluginlist',
  manageFiles: '_managefiles',
  updateLog: '_updateLog',
  repoDir: 'repo',
  archDir: 'arch',
  cacheDir: function cacheDir() {
    return 'cache\\' + PPx.Extract('%0').slice(3).replace(/\\/g, '@');
  }
};
var uniqID = {
  tempKey: 'K_ppmTemp',
  tempMenu: 'M_ppmTemp',
  virtualEntry: 'ppm_ve'
};
var fso = PPx.CreateObject('Scripting.FileSystemObject');
var isEmptyStr = function isEmptyStr(value) {
  return value === '';
};

var ppm = (function () {
  var expandNlCode = function expandNlCode(data) {
    var nl = '\n';
    var indexCr = data.indexOf('\r');
    if (~indexCr) {
      nl = data.substring(indexCr, indexCr + 2) === '\r\n' ? '\r\n' : '\r';
    }
    return nl;
  };

  /**
   * Hub to get streams.
   * @return [error, "error message"|"file contents"]
   */
  var _exec = function _exec(st, callback) {
    try {
      var _callback;
      var data = (_callback = callback()) != null ? _callback : '';
      return [false, data];
    } catch (err) {
      return [true, ''];
    } finally {
      st.Close();
    }
  };
  /**
   * Reads the file and returns the contents.
   * @return [error, "file contents"|"error message"]
   * @param enc [default:"utf8"] "sjis"|"utf16le"|"utf8"
   */
  var read = function read(_ref) {
    var path = _ref.path,
      _ref$enc = _ref.enc,
      enc = _ref$enc === void 0 ? 'utf8' : _ref$enc;
    if (!fso.FileExists(path)) {
      return [true, path + ' not found'];
    }
    var f = fso.GetFile(path);
    if (f.Size === 0) {
      return [true, path + ' has no data'];
    }
    var error = false,
      data = '';
    if (enc === 'utf8') {
      var st = PPx.CreateObject('ADODB.Stream');
      var _exec2 = _exec(st, function () {
        st.Open();
        // st.Type = 2;
        st.Charset = 'UTF-8';
        st.LoadFromFile(path);
        return st.ReadText(-1);
      });
      error = _exec2[0];
      data = _exec2[1];
    } else {
      var tristate = enc === 'utf16le' ? -1 : 0;
      var _st = f.OpenAsTextStream(1, tristate);
      var _exec3 = _exec(_st, function () {
        return _st.ReadAll();
      });
      error = _exec3[0];
      data = _exec3[1];
    }
    return error ? [true, 'Unable to read ' + path] : [false, data];
  };
  /**
   * Read lines from a file.
   * @param path Read file
   * @param enc [default:"utf8"] "sjis"|"utf16le"|"utf8"
   * @param linefeed "\r\n"|"\r"|"\n"
   * @return [error, "error message"|{lines: file contents, nl: newline code}]
   */
  var readLines = function readLines(_ref2) {
    var _linefeed;
    var path = _ref2.path,
      _ref2$enc = _ref2.enc,
      enc = _ref2$enc === void 0 ? 'utf8' : _ref2$enc,
      linefeed = _ref2.linefeed;
    var _read = read({
        path: path,
        enc: enc
      }),
      error = _read[0],
      stdout = _read[1];
    if (error) {
      return [true, stdout];
    }
    linefeed = (_linefeed = linefeed) != null ? _linefeed : expandNlCode(stdout.slice(0, 1000));
    var lines = stdout.split(linefeed);
    if (isEmptyStr(lines[lines.length - 1])) {
      lines.pop();
    }
    return [
      false,
      {
        lines: lines,
        nl: linefeed
      }
    ];
  };
  // valid prefixes for property IDs
  var rgxId = /^([ABCEFHKMPSVX][BCEVTt]?_|_[CPSUWo]|Mes)/;
  var rejectInvalidString = function rejectInvalidString(rgx, value) {
    if (value.indexOf('@') === 0) {
      value = PPx.Extract(value).substring(1);
      if (!fso.FileExists(value)) {
        // ERROR_FILE_NOT_FOUND
        return 2;
      }
    } else if (!rgx.test(value)) {
      // ERROR_INVALID_DATA
      return 13;
    }
    // NO_ERROR
    return 0;
  };
  var dialog = function dialog(type, title, message) {
    if (title === void 0) {
      title = '';
    }
    title = isEmptyStr(title) ? '' : '/' + title;
    return PPx.Execute('%"ppm' + title + '" %OC %' + type + '"' + message + '"') === 0;
  };
  var hasTargetId = function hasTargetId(id) {
    return id !== '.';
  };
  /** Cache of ppm global properties */
  var cache = {
    lang: info.language
  };
  /** Create a cache of ppm global constants and return the value */
  var createCache = function createCache(key) {
    var value = PPx.Extract('%*getcust(S_ppm#global:' + key + ')');
    cache[key] = value;
    return value;
  };
  /** register temporary keys and return the command line for the input post command */
  var autoselectEnter = function autoselectEnter(cmdline) {
    PPx.Execute('%OC *setcust ' + uniqID.tempKey + ':ENTER,*if -1==%%*sendmessage(%%N-L,392,0,0)%%:%%K"@DOWN"%bn%bt%%K"@ENTER"');
    PPx.Execute('%OC *setcust ' + uniqID.tempKey + ':\\ENTER,*if -1==%%*sendmessage(%%N-L,392,0,0)%%:%%K"@DOWN"%bn%bt%%K"@ENTER"');
    return '*mapkey use,' + uniqID.tempKey + '%%:' + cmdline;
  };
  return {
    /** Display message in a dialog.
     * @return Whether the dialog was successfully closed
     * @param errorlevel - Optionally appends the error level to the end of the message
     */
    echo: function echo(title, message, errorlevel) {
      var tail = errorlevel ? '(' + String(errorlevel) + ')' : '';
      return dialog('I', '' + title, '' + message + tail);
    },
    /** Display an question dialog. */ question: function question(title, message) {
      return dialog('Q', '' + title, message);
    },
    /** Displays questions and answers and asks for choices. */ choice: function choice(ppxid, title, message, type, yes, no, cancel) {
      if (type === void 0) {
        type = 'ynC';
      }
      var tblId = 'Mes0411';
      var mes = {
        yes: tblId + ':IMYE',
        no: tblId + ':IMNO',
        cancel: tblId + ':IMTC'
      };
      var isSelfId = ppxid === '.';
      var loadcust = isSelfId ? '%K"@LOADCUST"' : '%%K"@LOADCUST"';
      var _ref3 = [],
        imye = _ref3[0],
        imno = _ref3[1],
        imtc = _ref3[2];
      var y = '',
        n = '',
        c = '';
      var load = false;
      if (yes) {
        imye = PPx.Extract('%*getcust(' + mes.yes + ')');
        y = '*setcust ' + mes.yes + '=' + yes + '%:';
        load = true;
      }
      if (no) {
        imno = PPx.Extract('%*getcust(' + mes.no + ')');
        n = '*setcust ' + mes.no + '=' + no + '%:';
        load = true;
      }
      if (cancel) {
        imtc = PPx.Extract('%*getcust(' + mes.cancel + ')');
        c = '*setcust ' + mes.cancel + '=' + cancel + '%:';
        load = true;
      }
      if (load) {
        PPx.Execute('' + y + n + c);
        ppm.execute(ppxid, loadcust);
      }
      var answer = {
        0: 'cancel',
        1: 'yes',
        2: 'no'
      };
      var id = isSelfId ? '' : ppxid;
      var code = PPx.Extract('%OCP %*extract(' + id + '"%%*choice(-text""' + message + '"" -title:""' + title + '"" -type:' + type + ')")');
      if (load) {
        !!imye && PPx.Execute('*setcust ' + mes.yes + '=' + imye);
        !!imno && PPx.Execute('*setcust ' + mes.no + '=' + imno);
        !!imtc && PPx.Execute('*setcust ' + mes.cancel + '= ' + imtc);
        ppm.execute(ppxid, loadcust);
      }
      return answer[code];
    },
    /**
     * Wrapper PPx.Execute.
     * @param ppxid - ID|"."|"tray" `period` means current PPx
     * @param command - PPx ex command line
     * @param wait - Wait for command to finish
     */
    execute: function execute(ppxid, command, wait) {
      if (wait === void 0) {
        wait = false;
      }
      if (isEmptyStr(command)) {
        return 1;
      }
      if (hasTargetId(ppxid)) {
        if (wait) {
          var n = PPx.Extract('%*extract(' + ppxid + ',"' + command + '%%&0")');
          return isEmptyStr(n) ? 1 : Number(n);
        } else {
          return PPx.Execute('*execute ' + ppxid + ',' + command);
        }
      } else {
        if (wait) {
          var _n = PPx.Extract(command + '%&0');
          return isEmptyStr(_n) ? 1 : Number(_n);
        } else {
          return PPx.Execute(command);
        }
      }
    },
    /**
     * Wrapper PPx.Execute synchronously.
     * @param ppbid
     * @param command - PPx ex command line
     */
    execSync: function execSync(ppbid, command) {
      if (isEmptyStr(command)) {
        return 1;
      }
      if (ppbid.length === 1) {
        ppbid = 'b' + ppbid;
      } else if (ppbid.toUpperCase().indexOf('B') !== 0) {
        return 6;
      }
      if (isEmptyStr(PPx.Extract('%N' + ppbid))) {
        return 6;
      }
      return Number(PPx.Extract('%*extract(' + ppbid.toUpperCase() + ',"' + command + '%%:%%*exitcode")'));
    },
    /**
     * Wrapper PPx.Extract.
     * @return [`errorlevel`, `value`]
     * @param ppxid - ID or "." `period` means current PPx
     * @param value - Expand `%macro`
     */
    extract: function extract(ppxid, value) {
      if (isEmptyStr(value)) {
        return [13, ''];
      }
      var data = hasTargetId(ppxid) ? PPx.Extract('%*extract(' + ppxid + ',"' + value + '")') : PPx.Extract(value);
      var errorlevel = Number(PPx.Extract());
      return [errorlevel, data];
    },
    /** Language use in ppm. */ lang: function lang() {
      var lang = cache['lang'];
      if (!isEmptyStr(lang)) {
        return lang;
      }
      var useLanguage = PPx.Extract('%*getcust(S_ppm#global:lang)');
      lang = useLanguage === 'en' || useLanguage === 'ja' ? useLanguage : info.language;
      cache['lang'] = lang;
      return lang;
    },
    /**
     * Expand the value of S:_ppm#global:subid.
     * @return A value or an empty-string
     */
    global: function global(subid) {
      var _cache$ppm, _cache$home;
      var value = cache[subid];
      if (value) {
        return value;
      }
      if (/^ppm[ahrcl]?/.test(subid)) {
        value = PPx.Extract("%sgu'" + subid + "'");
        if (isEmptyStr(value)) {
          var name = subid.replace('ppm', '');
          switch (name) {
            case '':
              value = (_cache$ppm = cache['ppm']) != null ? _cache$ppm : PPx.Extract('%*getcust(S_ppm#global:ppm)');
              break;
            case 'home':
              value = (_cache$home = cache['home']) != null ? _cache$home : PPx.Extract('%*getcust(S_ppm#global:home)');
              break;
            case 'lib':
              {
                var _cache$ppm2;
                var ppmDir = (_cache$ppm2 = cache['ppm']) != null ? _cache$ppm2 : createCache('ppm');
                value = ppmDir + '\\dist\\lib';
              }
              break;
            default: {
              var _cache$home2;
              var ppmHome = (_cache$home2 = cache['home']) != null ? _cache$home2 : createCache('home');
              if (name === 'cache') {
                value = ppmHome + '\\' + uniqName.cacheDir();
              }
            }
          }
        }
      } else {
        value = PPx.Extract('%*getcust(S_ppm#global:' + subid + ')');
      }
      cache[subid] = value;
      return value;
    },
    /** Expand the value of S_ppm#user:`subid`. */ user: function user(subid) {
      return PPx.Extract('%*extract("%%*getcust(S_ppm#user:' + subid + ')")');
    },
    /** Set S_ppm#user:`subid`=`value`. */ setuser: function setuser(subid, value) {
      if (isEmptyStr(value)) {
        return 1;
      }
      return PPx.Execute('*setcust S_ppm#user:' + subid + '=' + value);
    },
    /** Expand %\*name(`format`, "`filename`"[, "`path`"]). */ getpath: function getpath(format, filename, path) {
      if (path === void 0) {
        path = '';
      }
      var rgxName = /^[CXTDHLKBNPRVSU]+$/;
      var errorlevel = rejectInvalidString(rgxName, format);
      if (errorlevel !== 0) {
        return [errorlevel, ''];
      }
      if (isEmptyStr(filename)) {
        return [1, ''];
      }
      var pathspec = !isEmptyStr(path) ? ',"' + path + '"' : '';
      var value = PPx.Extract('%*name(' + format + ',"' + filename + '"' + pathspec + ')');
      errorlevel = Number(PPx.Extract());
      return [errorlevel, value];
    },
    /** Expand the value of %\*getcust(`prop`). */ getcust: function getcust(prop) {
      if (isEmptyStr(prop)) {
        return [1, ''];
      }
      var errorlevel = rejectInvalidString(rgxId, prop);
      if (errorlevel !== 0) {
        return [errorlevel, ''];
      }
      var value = PPx.Extract('%*getcust(' + prop + ')');
      return [errorlevel, value];
    },
    /** Set the property `prop`. */ setcust: function setcust(prop, multiline) {
      if (multiline === void 0) {
        multiline = false;
      }
      if (isEmptyStr(prop)) {
        return 1;
      }
      var errorlevel = rejectInvalidString(rgxId, prop);
      if (errorlevel !== 0) {
        return errorlevel;
      }
      var opt = multiline ? '%OC ' : '';
      return PPx.Execute(opt + '*setcust ' + prop);
    },
    /**
     * Delete the property id[:subid].
     * @param subid - "subid" or `false` skipped
     * @param load - Run LOADCUST or not
     */
    deletecust: function deletecust(id, subid, load) {
      var skipSubId = typeof subid === 'boolean';
      var rgx = /^\s*"?([^"\s]+)"?\s*?$/;
      var id_ = id.replace(rgx, '$1');
      var subid_ = String(subid);
      var errorlevel = rejectInvalidString(rgxId, id_);
      if (errorlevel !== 0) {
        return errorlevel;
      }
      var prop =
        subid != null && !skipSubId && !isEmptyStr(subid_)
          ? id_ + ',' + (typeof subid === 'string' ? '"' + subid.replace(rgx, '$1') + '"' : '' + subid)
          : '"' + id_ + '"';
      PPx.Execute('*deletecust ' + prop);
      if (load) {
        PPx.Execute('%K"loadcust"');
      }
      return 0;
    },
    /**
     * Set temporary key.
     * @return Temporary key table name
     */
    setkey: function setkey(subid, value, multiline, desc) {
      if (multiline === void 0) {
        multiline = false;
      }
      if (desc === void 0) {
        desc = '';
      }
      if (isEmptyStr(subid)) {
        throw new Error('SubId not specified');
      }
      if (!isEmptyStr(desc)) {
        desc = '*skip ' + desc + '%bn%bt';
        multiline = true;
      }
      var opt = multiline ? '%OC ' : '';
      PPx.Execute(opt + '*setcust ' + uniqID.tempKey + ':' + subid + ',' + desc + value);
      return uniqID.tempKey;
    },
    /** Delete a temporary menu. */ deletemenu: function deletemenu() {
      PPx.Execute('*deletecust "' + uniqID.tempMenu + '"');
    },
    /** Delete temporary keys. */ deletekeys: function deletekeys() {
      PPx.Execute('*deletecust "' + uniqID.tempKey + '"');
    },
    /** Set linecust. */ linecust: function linecust(_ref4) {
      var label = _ref4.label,
        id = _ref4.id,
        _ref4$sep = _ref4.sep,
        sep = _ref4$sep === void 0 ? '=' : _ref4$sep,
        _ref4$value = _ref4.value,
        value = _ref4$value === void 0 ? '' : _ref4$value,
        _ref4$esc = _ref4.esc,
        esc = _ref4$esc === void 0 ? false : _ref4$esc,
        _ref4$once = _ref4.once,
        once = _ref4$once === void 0 ? false : _ref4$once;
      var oneshot = once ? '*linecust ' + label + ',' + id + ',%%:' : '';
      if (!isEmptyStr(value) && esc) {
        value = '%(' + value + '%)';
      }
      PPx.Execute('*linecust ' + label + ',' + id + sep + oneshot + value);
    },
    /**
     * Expand the special environment variables on specified PPx[ID].
     * @param type - "[g]e"|"[g]i"|"[g]p"|"[g]u"
     */
    getvalue: function getvalue(ppxid, type, key) {
      if (isEmptyStr(key)) {
        return [1, ''];
      }
      var value = hasTargetId(ppxid)
        ? PPx.Extract('%*extract(' + ppxid + ',"%%s' + type + "'" + key + '\'")')
        : PPx.Extract('%s' + type + "'" + key + "'");
      var errorlevel = isEmptyStr(value) ? 13 : 0;
      return [errorlevel, value];
    },
    /**
     * Set the special environment variables on specified PPx[ID].
     * @param type - "e"|"i"|"p"|"u"
     */
    setvalue: function setvalue(ppxid, type, key, value) {
      if (isEmptyStr(key)) {
        return 1;
      }
      return hasTargetId(ppxid)
        ? PPx.Execute('*execute ' + ppxid + ',*string ' + type + ',' + key + '=' + value)
        : PPx.Execute('*string ' + type + ',' + key + '=' + value);
    },
    /** Calls the input-bar and returns the input string.
     * @return [errorlevel, "input string"]
     */
    getinput: function getinput(_ref5) {
      var _ref5$message = _ref5.message,
        message = _ref5$message === void 0 ? '' : _ref5$message,
        _ref5$title = _ref5.title,
        title = _ref5$title === void 0 ? '' : _ref5$title,
        _ref5$mode = _ref5.mode,
        mode = _ref5$mode === void 0 ? 'g' : _ref5$mode,
        _ref5$select = _ref5.select,
        select = _ref5$select === void 0 ? 'a' : _ref5$select,
        _ref5$multi = _ref5.multi,
        multi = _ref5$multi === void 0 ? false : _ref5$multi,
        _ref5$leavecancel = _ref5.leavecancel,
        leavecancel = _ref5$leavecancel === void 0 ? false : _ref5$leavecancel,
        _ref5$forpath = _ref5.forpath,
        forpath = _ref5$forpath === void 0 ? false : _ref5$forpath,
        _ref5$fordijit = _ref5.fordijit,
        fordijit = _ref5$fordijit === void 0 ? false : _ref5$fordijit,
        _ref5$autoselect = _ref5.autoselect,
        autoselect = _ref5$autoselect === void 0 ? false : _ref5$autoselect,
        _ref5$k = _ref5.k,
        k = _ref5$k === void 0 ? '' : _ref5$k;
      var rgxMode = /^[gnmshdcfuxeREOUX][gnmshdcfuxeSUX,]*$/;
      var m = multi ? ' -multi' : '';
      var l = leavecancel ? ' -leavecancel' : '';
      var fp = forpath ? ' -forpath' : '';
      var fd = fordijit ? ' -fordijit' : '';
      if (autoselect) {
        k = autoselectEnter(k);
      }
      var k_ = k !== '' ? ' -k %%OP- ' + k : '';
      var errorlevel = rejectInvalidString(rgxMode, mode);
      if (errorlevel !== 0) {
        return [errorlevel, ''];
      }
      var input = PPx.Extract(
        '%OCP %*input("' + message + '" -title:"' + title + '" -mode:' + mode + ' -select:' + select + m + l + fp + fd + k_ + ')'
      );
      errorlevel = Number(PPx.Extract());
      this.deletemenu();
      this.deletekeys();
      return [errorlevel, input];
    },
    /**
     * Show message.
     * @param status Display in StatusLine
     * @param multi Allow multiple lines
     */
    linemessage: function linemessage(ppxid, message, status, multi) {
      var onppb = PPx.Extract('%n').substring(0, 1) === 'B';
      var msg;
      if (typeof message === 'object') {
        var nl = '%%bn';
        var sep = multi ? nl : ' ';
        msg = message.join(sep);
      } else {
        msg = message;
      }
      ppxid = ppxid === '.' ? '' : ppxid;
      msg = status && !onppb ? '!"' + msg : msg;
      PPx.Execute('%OC *execute ' + ppxid + ',*linemessage ' + msg);
    },
    /** Display message in LogWindow */ report: function report(message) {
      var msg = typeof message === 'string' ? message : message.join(info.nlcode);
      PPx.Extract('%n').indexOf('B') === 0 ? PPx.linemessage(msg) : PPx.report(msg);
    },
    /** Closes the specified ID of PPx. */ close: function close(ppxid) {
      PPx.Execute('*closeppx ' + ppxid);
    },
    /**
     * Job.
     * @return () => ppm.execute(`ppxid`, '*job end')
     */
    jobstart: function jobstart(ppxid) {
      ppm.execute(ppxid, '*job start');
      return function () {
        return ppm.execute(ppxid, '*job end');
      };
    },
    getVersion: function getVersion(path) {
      path = path + '\\package.json';
      var _readLines = readLines({
          path: path
        }),
        error = _readLines[0],
        data = _readLines[1];
      if (!error) {
        var rgx = /^\s*"version":\s*"([0-9\.]+)"\s*,/;
        for (var i = 2, k = data.lines.length; i < k; i++) {
          if (~data.lines[i].indexOf('"version":')) {
            return data.lines[i].replace(rgx, '$1');
          }
        }
      }
      return;
    }
  };
})();
var test = (function () {
  var rgx = RegExp(info.nlcode, 'g');
  var usePPb = PPx.Extract('%NBT') !== '';
  var _display = function _display(msg) {
    if (!usePPb) {
      PPx.report(msg + info.nlcode);
    } else {
      ppm.execute('BT', '*linemessage ' + msg.replace(rgx, '%%bn'));
    }
  };
  var _objExtract = function _objExtract(o) {
    var valueType = 'object';
    var result;
    if (o instanceof Array) {
      valueType = 'array';
      result = '[' + o.join(', ') + ']';
    } else {
      var arr = [];
      for (var _i2 = 0, _Object$keys2 = Object.keys(o); _i2 < _Object$keys2.length; _i2++) {
        var key = _Object$keys2[_i2];
        var v = typeof o[key] === 'string' ? '"' + o[key] + '"' : o[key];
        arr.push(key + ':' + v);
      }
      result = '' + arr.join(', ');
    }
    return [valueType, result];
  };
  var _benchAction = function _benchAction(count, callback) {
    var startTime = new Date().getTime();
    for (var i = 0; i < count; i++) {
      callback();
    }
    var endTime = new Date().getTime();
    return (endTime - startTime) / 1000;
  };
  var _createTableName = function _createTableName(att) {
    var head = /^[EKM]$/.test(att) ? att : 'K';
    return head + '_ppmTemp';
  };
  var _createTable = function _createTable(att, menu, session) {
    var setcusts = [];
    var delim = {
      E: ',',
      K: ',',
      M: '='
    }[att];
    tableProps = {};
    session();
    for (var _i4 = 0, _Object$keys4 = Object.keys(tableProps); _i4 < _Object$keys4.length; _i4++) {
      var key = _Object$keys4[_i4];
      setcusts.push('*setcust ' + menu + ':' + key + delim + tableProps[key]);
    }
    PPx.Execute(setcusts.join('%:'));
  };
  var _propRun = function _propRun(att) {
    if (att === 'E') {
      PPx.Execute('%ME_ppmTemp');
    } else if (att === 'M') {
      PPx.Execute('%' + uniqID.tempMenu);
    } else {
      var onPPb = usePPb ? '*execute BT,' : '';
      PPx.Execute(
        '*setcust ' +
          uniqID.tempKey +
          ':ESC,*mapkey delete,' +
          uniqID.tempKey +
          '%%:*deletecust "' +
          uniqID.tempKey +
          '"%%:' +
          onPPb +
          '*linemessage [test/table] clear'
      );
      PPx.Execute('*mapkey use,' + uniqID.tempKey);
      _display('[test/table] ESC-key to clear test keys');
    }
  };
  var benchFuncs = {};
  var tableProps = {};
  return {
    print: function print(ppxid, value) {
      var valueType = value === null ? 'null' : typeof value;
      var msg;
      if (valueType === 'object') {
        var _objExtract2 = _objExtract(value);
        valueType = _objExtract2[0];
        msg = _objExtract2[1];
      } else {
        msg = ppm.extract(ppxid, value)[1];
      }
      return _display('[test/print]' + info.nlcode + 'Type:\t' + valueType + info.nlcode + 'Value:\t' + msg);
    },
    measure: function measure(subject, callback) {
      benchFuncs[subject] = callback;
    },
    benchmark: function benchmark(desc, count, session) {
      benchFuncs = {};
      session();
      // preparation
      _benchAction(100, function () {
        return Math.pow(1, 1);
      });
      _display('Running ' + desc + '...');
      for (var _i6 = 0, _Object$keys6 = Object.keys(benchFuncs); _i6 < _Object$keys6.length; _i6++) {
        var key = _Object$keys6[_i6];
        var resultTime = _benchAction(count, benchFuncs[key]);
        _display(resultTime + '\t#' + key + ': ' + benchFuncs[key]());
      }
      _display('Finish');
    },
    tableItem: function tableItem(key, value) {
      tableProps[key] = value;
    },
    table: function table(att, callback) {
      att = att.toUpperCase();
      var tableName = _createTableName(att);
      _createTable(att, tableName, function () {
        return callback();
      });
      _propRun(att);
      if (att !== 'K') {
        PPx.Execute('*deletecust "' + tableName + '"');
      }
    }
  };
})();
