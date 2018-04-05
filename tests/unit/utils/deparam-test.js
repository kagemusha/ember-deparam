import  { deparam } from 'ember-deparam/utils/deparam';
import { module, test } from 'qunit';
import { typeOf } from '@ember/utils';
import $ from 'jquery';

module('Unit | Utility | deparam');

const UNCOERCED_PROP_STRING_TYPES = [
  ['prop=sillystring', 'string'],
  ['prop[]=one&prop[]=two', 'array'],
  ['prop[prop2]=somestring', 'object'],
  ['prop=false', 'string'],
  ['prop=1234', 'string']
];

const COERCED_PROP_STRING_TYPES = [
  ['prop=false','boolean'],
  ['prop=true','boolean'],
  ['prop=null','null'],
  ['prop=undefined','undefined'],
  ['prop=1234','number'],
  ['prop=999999999999999999','string']
];

test('uncoerced deparamed string types are correct', (assert) => {
  testDeparamedTypes(assert, UNCOERCED_PROP_STRING_TYPES);
});

test('coerced deparamed string types are correct', (assert) => {
  testDeparamedTypes(assert, COERCED_PROP_STRING_TYPES, true);
});

function testDeparamedTypes(assert, stringTypeArray, coerce=false) {
  stringTypeArray.forEach(((stringType) => {
    const propString = stringType[0];
    const prop = deparam(propString, coerce).prop;
    const type = stringType[1];
    assert.equal(typeOf(prop), type, `Prop string(${coerce ? "coerced":"uncoerced"}): ${propString}`);
  }));
}


test('parses any param name correctly including those of built in Object property names', (assert) => {
  assert.equal(deparam('hasOwnProperty=sillystring').hasOwnProperty, 'sillystring');
  assert.equal(deparam('prop[hasOwnProperty]=sillystring').prop.hasOwnProperty, 'sillystring');
});

test('deserializes 1.4-style params', (assert) => {
  const paramStr = 'a[]=4&a[]=5&a[]=6&b[x][]=7&b[y]=8&b[z][]=9&b[z][]=0&b[z][]=true&b[z][]=false&b[z][]=undefined&b[z][]=&c=1';
  const paramsObj = { a:['4','5','6'], b:{x:['7'], y:'8', z:['9','0','true','false','undefined','']}, c:'1' };
  assert.deepEqual(deparam(paramStr), paramsObj);
});


test('deserializes pre-1.4-style params', (assert) => {
  const paramStr = 'a=1&a=2&a=3&b=4&c=5&c=6&c=true&c=false&c=undefined&c=&d=7';
  const paramsObj = { a:['1','2','3'], b:'4', c:['5','6','true','false','undefined',''], d:'7' };
  assert.deepEqual(deparam(paramStr), paramsObj);
});

test('deserializes pre1.4-style params with coercion', (assert) => {
  const paramStr = 'a=1&a=2&a=3&b=4&c=5&c=6&c=true&c=false&c=undefined&c=&d=7';
  const paramsObj = { a:[1,2,3], b:4, c:[5,6,true,false,undefined,''], d:7 };
  assert.deepEqual(deparam(paramStr, true), paramsObj);
});

const PARAMED_OBJ_TEST_CASES = [
  ['trivial', {a: '1'}],
  ['simple', {user: {email: "tester", password: "tester123"}}],
  ['complex', { a: { b: '1', c: '2' }, d: [ '3', '4', { e: '5' } ] }]
];


test('objects work', (assert) => {
  PARAMED_OBJ_TEST_CASES.forEach(((testCase) => {
    deparamTest(assert, testCase[0], testCase[1]);
  }));
});


function deparamTest(assert, testLabel, paramsObject){
  const paramString = $.param(paramsObject);
  let deparamedObject = deparam(paramString);
  assert.deepEqual(paramsObject, deparamedObject, `Test deparams: ${testLabel}` );
}
