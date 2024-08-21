/* @file Mess with the highlights
 * @arg 0 {number} - If non-zero, enable highlight editing
 * @arg 1 {number} - If non-zero, run it in PPe
 */

import '@ppmdev/polyfills/stringTrim.ts';
import {safeArgs} from '@ppmdev/modules/argument.ts';
import {info, uniqID, useLanguage} from '@ppmdev/modules/data.ts';
import debug from '@ppmdev/modules/debug.ts';
import {runPPe} from '@ppmdev/modules/run.ts';
import type {HighlightNumber} from '@ppmdev/modules/types.ts';

const PLUGIN_NAME = 'ppm-test';
const PPE_TITLE = 'Highlight Hex';
const scriptName = PPx.ScriptName;

const main = (): void => {
  const [isEdit, onPPe] = safeArgs(false, false);

  onPPe ? procEdit() : procShow(isEdit);
};

const _foreachEntry = (fallback: (eInfo: string[], n: HighlightNumber) => void): string[] => {
  const eInfo = PPx.Extract('%*getcust(C_eInfo)').split(',');
  let i = 0 as HighlightNumber;

  do {
    fallback(eInfo, i);
  } while (++i <= 7);

  return eInfo;
};

const _loadPPe = (hexColors: string[]): void => {
  const winsize = '*windowsize %N.,200,300';
  const fitwin = '*fitwindow %NC,%N.,5';
  const mapkey = `*mapkey use,${uniqID.tempKey}`;
  const draft = `*insert "${hexColors.join('%bn')}"`;

  PPx.Execute(`*setcust ${uniqID.tempKey}:^S,%(%"${PLUGIN_NAME}"%Q"${lang.save}"%:*script ${scriptName},1,1%)`);
  runPPe({wait: true, title: PPE_TITLE, history: '', modify: 'silent', k: `${winsize}%:${fitwin}%:${mapkey}%:${draft}`});
  PPx.Execute(`*deletecust "${uniqID.tempKey}"`);
};

const procShow = (isEdit: boolean): void => {
  PPx.Execute('%KC"@F5"%:*wait 0,2');

  const initialIdx = isEdit ? 0 : PPx.EntryIndex;
  const hexColors: string[] = [];

  _foreachEntry((eInfo, n) => {
    const value = eInfo[n + 13].trim();
    const hlIdx = (n + 1) as HighlightNumber;
    const entryIdx = initialIdx + n;
    const entryName = `Highlight:${hlIdx} ${value}`;
    hexColors.push(value);
    PPx.EntryInsert(entryIdx, entryName);
    PPx.Entry.Item(entryIdx).Highlight = hlIdx;
  });

  if (isEdit && PPx.Extract(`%*findwindowtitle("${PPE_TITLE}")`) === '0') {
    _loadPPe(hexColors);
  }
};

const procEdit = (): void => {
  if (PPx.Extract('*if %N==%NC%:1') === '1') {
    PPx.Quit(1);
  }

  const editColors = PPx.Extract('%*edittext()').split(info.nlcode);
  const rgx = /^(h\w{6}|_(BLA|BLU|RED|MAG|GRE|CYA|BRO|WHI|DBLA|DBLU|DRED|DMAG|DGRE|DCYA|DBRO|DWHI|MGRE|SBLU|CREM|GRAY))/i;
  const eInfo = _foreachEntry((eInfo, n) => {
    const value = rgx.test(editColors[n]) ? editColors[n].toUpperCase() : '_AUTO';
    eInfo[n + 13] = value.trim();
  });

  PPx.Execute(`*customize C_eInfo=${eInfo.join(',')}`);
  PPx.Execute(`*execute C,*script ${scriptName}`);
};

const lang = {
  en: {save: 'Save/reload highlight information being edited'},
  ja: {save: '編集中のハイライト情報を保存・再読み込みします'}
}[useLanguage()];

main();
