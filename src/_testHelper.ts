/* Implementation of test helper object */

import '@ppmdev/polyfills/stringTrim.ts';
import '@ppmdev/polyfills/objectKeys.ts';
import {info, uniqID} from '@ppmdev/modules/data.ts';
import {ppm} from '@ppmdev/modules/ppm.ts';

type TableAtt = 'E' | 'K' | 'M';
type Test = {
  print: (ppxid: string, value: any) => void;
  measure: (subject: string, callback: () => any) => void;
  benchmark: (desc: string, count: number, session: () => void) => void;
  tableItem: (key: string, value: string) => void;
  table: (att: TableAtt, callback: () => void) => void;
};

const test = (() => {
  const rgx = RegExp(info.nlcode, 'g');
  const usePPb = PPx.Extract('%NBT') !== '';
  const _display = (msg: string): void => {
    if (!usePPb) {
      PPx.report(info.nlcode + msg);
    } else {
      ppm.execute('BT', `*linemessage ${msg.replace(rgx, '%%bn')}`);
    }
  };
  const _objExtract = (o: Record<string, any>) => {
    let valueType = 'object';
    let result: string;

    if (o instanceof Array) {
      valueType = 'array';
      result = `[${o.join(', ')}]`;
    } else {
      const arr = [];

      for (const key of Object.keys(o)) {
        const v = typeof o[key] === 'string' ? `"${o[key]}"` : o[key];
        arr.push(`${key}:${v}`);
      }

      result = `${arr.join(', ')}`;
    }

    return [valueType, result];
  };
  const _benchAction = (count: number, callback: () => any) => {
    const startTime = new Date().getTime();

    for (let i = 0; i < count; i++) {
      callback();
    }

    const endTime = new Date().getTime();

    return (endTime - startTime) / 1000;
  };
  const _createTableName = (att: TableAtt): string => {
    const head = /^[EKM]$/.test(att) ? att : 'K';

    return `${head}_ppmTemp`;
  };
  const _createTable = (att: TableAtt, menu: string, session: () => void): void => {
    const setcusts: string[] = [];
    const delim = {E: ',', K: ',', M: '='}[att];
    tableProps = {};
    session();

    for (const key of Object.keys(tableProps)) {
      setcusts.push(`*setcust ${menu}:${key}${delim}${tableProps[key]}`);
    }

    PPx.Execute(setcusts.join('%:'));
  };
  const _propRun = (att: TableAtt): void => {
    if (att === 'E') {
      PPx.Execute('%ME_ppmTemp');
    } else if (att === 'M') {
      PPx.Execute(`%${uniqID.tempMenu}`);
    } else {
      const onPPb = usePPb ? '*execute BT,' : '';

      PPx.Execute(
        `*setcust ${uniqID.tempKey}:ESC,*mapkey delete,${uniqID.tempKey}%%:*deletecust "${uniqID.tempKey}"%%:${onPPb}*linemessage [test/table] clear`
      );
      PPx.Execute(`*mapkey use,${uniqID.tempKey}`);
      _display('[test/table] ESC-key to clear test table');
    }
  };

  let benchFuncs: Record<string, () => any> = {};
  let tableProps: Record<string, string> = {};

  return {
    print(ppxid: string, value: any) {
      let valueType = value === null ? 'null' : typeof value;
      let msg: string;

      if (valueType === 'object') {
        [valueType, msg] = _objExtract(value);
      } else {
        msg = ppm.extract(ppxid, value)[1];
      }

      return _display(`[test/print]${info.nlcode}Type:\t${valueType}${info.nlcode}Value:\t${msg}`);
    },
    measure(subject: string, callback: () => any): void {
      benchFuncs[subject] = callback;
    },
    benchmark(desc: string, count: number, session: () => void): void {
      benchFuncs = {};
      session();
      // preparation
      _benchAction(100, () => 1 ** 1);
      _display(`Running ${desc}...`);

      for (const key of Object.keys(benchFuncs)) {
        const resultTime = _benchAction(count, benchFuncs[key]);
        _display(`${resultTime}\t#${key}: ${benchFuncs[key]()}`);
      }

      _display('Finish');
    },
    tableItem(key: string, value: string): void {
      tableProps[key] = value;
    },
    table(att: TableAtt, callback: () => void): void {
      att = att.toUpperCase() as TableAtt;
      const tableName = _createTableName(att);
      _createTable(att, tableName, () => callback());
      _propRun(att);

      if (att !== 'K') {
        PPx.Execute(`*deletecust "${tableName}"`);
      }
    }
  } as Test;
})();
