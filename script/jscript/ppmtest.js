//!*script
/**
 * UnitTest 0.1.0
 *
 */

var has_color = true;
var equality = function (expected, actual) {
  if (expected === 'undefined' && typeof actual === 'undefined') {
    return true;
  }
  if (typeof expected !== 'object' && typeof actual !== 'object') {
    return expected === actual;
  }
  if (expected.length !== actual.length) {
    return false;
  }
  for (var itemE in expected) {
    if (Object.prototype.hasOwnProperty.call(expected, itemE)) {
      var isEqual = false;
      for (var itemA in actual) {
        if (Object.prototype.hasOwnProperty.call(actual, itemA)) {
          if (expected[itemE] === actual[itemA]) {
            isEqual = true;
            continue;
          }
          return false;
        }
      }
      if (!isEqual) return false;
    }
  }
  return true;
};
var assert = {
  equal: function (expected, actual) {
    if (equality(expected, actual)) {
      stats.scoreSuccess();
    } else {
      stats.scoreFailure(expected, actual, false);
    }
  },
  notEqual: function (expected, actual) {
    if (!equality(expected, actual)) {
      stats.scoreSuccess();
    } else {
      stats.scoreFailure(expected, actual, true);
    }
  },
  // match: function (expected, actual) {
  //   if (equality(expected, actual)) {
  //     stats.scoreSuccess();
  //   } else {
  //     stats.scoreFailure(expected, actual);
  //   }
  // },
  do: function (expected, callback) {
    ppm_test_run = 3;
    var exitcode = callback();
    ppm_test_run = 2;
    return equality(expected, exitcode)
      ? stats.scoreSuccess()
      : stats.scoreFailure(expected, exitcode, false);
  }
};
var e_cl = has_color ? '%bx1b[0m' : '';
var e_f = function (num) {
  return '%bx1b[' + num + 'F';
};
var e_m = function (num) {
  return has_color ? '%bx1b[' + num + 'm' : '';
};
var msg_join = function () {
  var args = [].slice.call(arguments);

  return '*linemessage %(' + args.join('') + '%)';
};
var stats = {
  init: function () {
    this.succeed = 0;
    this.failed = 0;
    this.subject = '';
  },
  scoreSuccess: function () {
    PPx.Execute('*execute BT,' + msg_join(e_f('2'), e_m('1;32'), 'ok ', e_cl, this.subject));
    this.succeed++;
  },
  scoreFailure: function (expected, actual, notexp) {
    var exp = !!notexp ? '# not expected:' : '# expected:';
    PPx.Execute(
      '*execute BT,' +
        msg_join(
          e_f('2') + e_m('31') + 'not ok ' + e_cl + this.subject + '%bn',
          e_m('33') + exp + '%bt[%(type:' + typeof expected + ', value:' + expected + '%)]%bn',
          '# actual:%bt[%(type:' + typeof actual + ', value:' + actual + '%)]' +  e_cl
        )
    );
    this.failed++;
  },
  scoreSkip: function () {
    PPx.Execute('*execute BT,' + msg_join(e_f('2'), e_m('35'), 'skip ', e_cl, this.subject));
    this.succeed++;
  },
  scoreResult: function () {
    PPx.Execute(
      '*execute BT,' + msg_join(e_f('2'), this.succeed, ' successes / ', this.failed, ' failures')
    );
  }
};
var describe = function (desc, obj) {
  stats.init();
  PPx.Execute('*execute BT,' + msg_join('%bn', e_f('2'), e_m('37;44'), desc, e_cl));
  obj();
  stats.scoreResult();
};
var it = function (subject, obj) {
  stats.subject = subject;
  obj();
};
var skip = function (subject, obj) {
  if (typeof conv_skip_to_it !== 'undefined' && conv_skip_to_it === true) {
    return it(subject, obj);
  }
  stats.subject = subject;
  stats.scoreSkip();
};
PPx.Execute('*execute BT,' + msg_join(e_m('47;30'), 'PASS: ', target_name, e_cl));
