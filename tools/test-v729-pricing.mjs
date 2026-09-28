import fs from 'node:fs';
import vm from 'node:vm';
import { calculateQuote } from '../netlify/functions/lib/paypal-pricing.mjs';

const source = fs.readFileSync(new URL('../jp.js', import.meta.url), 'utf8').split('// ============================================================')[0];

class ClassList { toggle() { return false; } add() {} remove() {} }
class El {
  constructor(value = '') { this.value=value; this.checked=false; this.textContent=''; this.classList=new ClassList(); this.listeners={}; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  fire(type) { for (const fn of this.listeners[type] || []) fn({ target:this }); }
}

const ids = {
  '#contact-form':new El(), '#plan-select':new El('consult'), '#people-select':new El('solo'),
  '#group-count-wrap':new El(), '#group-count':new El('3'), '#extra-track-count':new El('0'),
  '#extra-harmony':new El(), '#extra-adlib':new El(), '#extra-private':new El(), '#rush-select':new El('none'),
  '#deadline-input':null, '#summary-plan':new El(), '#summary-people':new El(), '#summary-extra':new El(),
  '#summary-rush':new El(), '#summary-total':new El(), '#mail-estimate-plan':new El(), '#mail-estimate-people':new El(),
  '#mail-estimate-extra':new El(), '#mail-estimate-rush':new El(), '#mail-estimate-total':new El(),
  '#extra-work-select':null, '#extra-work-trigger-text':null, '.nav-links':null, '[data-mobile-menu]':null
};
const compact = [new El(), new El()];
const document = {
  querySelector: selector => ids[selector] ?? null,
  querySelectorAll: selector => selector === '[data-estimate-total]' ? compact : [],
  addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') fn(); }
};
vm.runInNewContext(source, { document, Date, Intl, Number, String, Boolean, Math, console });

function change(el, value) { el.value=String(value); el.fire('input'); el.fire('change'); }
function setCheck(el, value) { el.checked=value; el.fire('input'); el.fire('change'); }
function setFrontend(q) {
  change(ids['#plan-select'], q.plan);
  change(ids['#people-select'], q.partyType);
  if (q.partyType === 'group') change(ids['#group-count'], q.participantCount);
  change(ids['#extra-track-count'], q.extraVocalTracks);
  setCheck(ids['#extra-harmony'], q.options.includes('harmony'));
  setCheck(ids['#extra-adlib'], q.options.includes('adlib'));
  setCheck(ids['#extra-private'], q.options.includes('private'));
  change(ids['#rush-select'], q.rush);
  return ids['#summary-total'].textContent;
}
function numericDisplayed(text) {
  const m = text.match(/^¥([0-9,]+)(〜)?$/);
  if (!m) throw new Error(`Unexpected frontend total: ${text}`);
  return { amount:Number(m[1].replaceAll(',','')), variable:Boolean(m[2]) };
}

const plans=['light','standard','deluxe'];
const parties=[['solo',1],['duet',2],['group',3],['group',4],['group',5],['group',6],['group',8],['group',10],['group',12],['group',20]];
const tracks=[0,1,4,10];
const optionSets=[];
for (let mask=0; mask<8; mask++) optionSets.push(['harmony','adlib','private'].filter((_,i)=>mask&(1<<i)));
const rushes=['none','rush48','rush24'];
let checked=0;
for (const plan of plans) for (const [partyType,participantCount] of parties) for (const extraVocalTracks of tracks) for (const options of optionSets) for (const rush of rushes) {
  const q={plan,partyType,participantCount,extraVocalTracks,options,rush};
  const server=calculateQuote(q).amountJPY;
  const front=numericDisplayed(setFrontend(q));
  if (front.amount !== server) throw new Error(`Parity mismatch ${JSON.stringify(q)} frontend=${front.amount} server=${server}`);
  const shouldVariable = plan === 'deluxe' || partyType !== 'solo' || options.includes('harmony') || options.includes('adlib');
  if (front.variable !== shouldVariable) throw new Error(`Suffix mismatch ${JSON.stringify(q)} text=${ids['#summary-total'].textContent}`);
  checked++;
}

const exact = [
  [{plan:'light',partyType:'solo',participantCount:1,extraVocalTracks:0,options:[],rush:'none'},4000],
  [{plan:'standard',partyType:'solo',participantCount:1,extraVocalTracks:0,options:[],rush:'none'},5500],
  [{plan:'deluxe',partyType:'solo',participantCount:1,extraVocalTracks:0,options:[],rush:'none'},6500],
  [{plan:'light',partyType:'duet',participantCount:2,extraVocalTracks:0,options:[],rush:'none'},8000],
  [{plan:'standard',partyType:'duet',participantCount:2,extraVocalTracks:0,options:[],rush:'none'},10000],
  [{plan:'deluxe',partyType:'duet',participantCount:2,extraVocalTracks:0,options:[],rush:'none'},12000],
  [{plan:'light',partyType:'group',participantCount:12,extraVocalTracks:0,options:[],rush:'none'},48000],
  [{plan:'standard',partyType:'group',participantCount:12,extraVocalTracks:0,options:[],rush:'none'},60000],
  [{plan:'deluxe',partyType:'group',participantCount:12,extraVocalTracks:0,options:[],rush:'none'},72000],
  [{plan:'standard',partyType:'group',participantCount:12,extraVocalTracks:2,options:['harmony','private'],rush:'rush48'},83200],
  [{plan:'deluxe',partyType:'group',participantCount:10,extraVocalTracks:4,options:['harmony','adlib','private'],rush:'rush24'},99000]
];
for (const [q,expected] of exact) {
  const got=calculateQuote(q).amountJPY;
  if (got !== expected) throw new Error(`Exact fixture mismatch ${JSON.stringify(q)} ${got} != ${expected}`);
}

const invalid = [
  {plan:'standard',partyType:'duet',participantCount:1,extraVocalTracks:0,options:[],rush:'none'},
  {plan:'standard',partyType:'group',participantCount:2,extraVocalTracks:0,options:[],rush:'none'},
  {plan:'standard',partyType:'solo',participantCount:2,extraVocalTracks:0,options:[],rush:'none'}
];
for (const q of invalid) {
  let threw=false; try { calculateQuote(q); } catch { threw=true; }
  if (!threw) throw new Error(`Invalid quote accepted ${JSON.stringify(q)}`);
}

console.log(`V7.2.9 pricing parity PASS: ${checked} frontend/server combinations + ${exact.length} exact fixtures + ${invalid.length} invalid cases`);
