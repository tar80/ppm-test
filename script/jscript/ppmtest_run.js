//!*script
/**
 * UnitTest run
 *
 * @arg {...} Arguments required for scripts that perform unit test
 */

if (PPx.Extract('%NBT') === '') {
  PPx.Echo('PPb[T] is not apply.');
  PPx.Quit(1);
}

var target_name;
var print = function (msg) {
  PPx.Execute('*execute BT,echo %bx1b[1;31m[WARN] ' + msg + '%bx1b[0m')
}
var utp_path = (function () {
  var fso = PPx.CreateObject('Scripting.FileSystemObject');
  var path = PPx.Extract("%'unit_test_ppm'");

  if (path === '') {
    print('Target file path not found');
    PPx.Quit(1);
  }

  if (!fso.FileExists(path)) {
    print(path + ' does not exist');
    PPx.Quit(1);
  }

  var name = fso.GetFileName(path);
  var fileContents = ~name.indexOf('utp_') ? 'test' : 'target';

  if (fileContents === 'test') {
    name = name.replace('utp_', '');
  }

  var paired = (function () {
    var stDirectory = fso.GetFolder(fso.GetParentFolderName(path));
    var patterns = {
      test: [
        [
          '\\script\\jscript\\',
          '\\module\\jscript\\',
          '\\lib\\jscript\\',
        ],
        'target'
      ],
      target: [['\\t\\utp_'], 'source']
    }[fileContents];

    var buildPath;

    do {
      stDirectory = stDirectory.ParentFolder;

      for (var i = 0, l = patterns[0].length; i < l; i++) {
        var thisPath = patterns[0][i];
        buildPath = fso.BuildPath(stDirectory, thisPath + name);

        if (fso.FileExists(buildPath)) {
          return buildPath;
        }
      }

      if (stDirectory === null) {
        break;
      }
    } while (!stDirectory.IsRootFolder);

    print(patterns[1] + ' file does not exist');
    PPx.Quit(1);
  })();

  target_name = name;

  return fileContents === 'target' ? {target: path, test: paired} : {target: paired, test: path};
})();

var st = PPx.CreateObject('ADODB.stream');
var data = function (filepath) {
  st.Open;
  st.Type = 2;
  st.Charset = 'UTF-8';
  st.LoadFromFile(filepath);
  var contents = st.ReadText(-1);
  st.Close;

  return contents;
};

var ppm_test_run = 1;
eval(data(PPx.Extract('%*name(D,"' + PPx.ScriptName + '")') + '\\ppmtest.js'));
eval(data(utp_path.target));
ppm_test_run = 2;
eval(data(utp_path.test));
