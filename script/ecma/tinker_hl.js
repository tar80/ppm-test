﻿//!*script
/**
 * Tinkering with Highlights
 *
 * @version 1.0
 * @arg {number} 0 Specify process. 0=load highlights | 1=save highlights and load it
 * @arg {number} 1 If non-zero, output hexadecimal color information to PPe
 */

'use strict';

const NL_CHAR = '\r\n';
const NL_CODE = 'crlf';
const NL_PPX = '%%bn';
const PPE_TITLE = 'Highlight Hex';

const g_args = ((args = PPx.Arguments) => {
  const ary = [0, 0];

  for (let i = 0, l = args.length; i < l; i++) {
    ary[i] = args.Item(i) | 0;
  }

  return {
    proc: ary[0] === 0 ? 'load' : 'save',
    ppe: ary[1] !== 0
  };
})();

const hl_info = PPx.Extract('%*getcust(C_eInfo)').split(',');
const entry_idx = PPx.EntryIndex;

const loop_hl_range = (callback) => {
  for (let i = 0; i < 7; i++) {
    callback(i);
  }
};

const proc = {};
proc['load'] = () => {
  const hl_hex = [];

  PPx.Execute('%KC"@F5"%:*wait 0,2');

  loop_hl_range((n) => {
    const hex = hl_info[n + 13].trim();
    const hlEntry = `highlight${n + 1} ${hex}`;

    hl_hex.push(hex);
    PPx.EntryInsert(n + entry_idx, hlEntry);
    PPx.Execute(`*markentry -highlight:${n + 1} ${hlEntry}`);
  });

  if (g_args.ppe && PPx.Extract(`%*findwindowtitle("${PPE_TITLE} *")`) === '0') {
    PPx.Execute(
      '*setcust K_ppmTestTemp:^s,' +
        '%%"ppm-test"%%Q"Save editing color information and reload highlights?"%%:' +
        `*script ${PPx.ScriptName},1`
    );
    PPx.Execute(
      `*edit -utf8 -${NL_CODE} -k *editmode -modify:silent%%:` +
        `*setcaption ${PPE_TITLE}%%:` +
        '*windowsize %%N.,200,300%%:' +
        '*fitwindow %%NC,%%N.,5%%:' +
        '*mapkey use,K_ppmTestTemp%%:' +
        `*insert "${hl_hex.join(NL_PPX)}"`
    );
    PPx.Execute('*deletecust "K_ppmTestTemp"');
  }
};
proc['save'] = () => {
  if (PPx.Extract('*if %N==%NC %: 1') === '1') {
    PPx.Echo('No color information available');
    PPx.Quit(1);
  }

  const hl_new = PPx.Extract('%*edittext').split(NL_CHAR);
  const reg =
    /^(h\w{6}|_(BLA|BLU|RED|MAG|GRE|CYA|BRO|WHI|DBLA|DBLU|DRED|DMAG|DGRE|DCYA|DBRO|DWHI|MGRE|SBLU|CREM|GRAY))/i;

  loop_hl_range((n) => {
    const col = reg.test(hl_new[n]) ? hl_new[n].toUpperCase() : '_AUTO';
    hl_info[n + 13] = col.trim();
  });

  PPx.Execute(`*customize C_eInfo=${hl_info.join(',')}`);
  PPx.Execute(`*execute C,*script ${PPx.ScriptName}`);
};

proc[g_args.proc]();
