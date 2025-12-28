import{c}from"./index-B1iCb0U8.js";import{t as h,c as r}from"./startOfWeek-D6dzzDOw.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=c("ChartPie",[["path",{d:"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z",key:"pzmjnu"}],["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}]]);function f(a,n){const t=h(a);if(isNaN(n))return r(a,NaN);const o=t.getDate(),e=r(a,t.getTime());e.setMonth(t.getMonth()+n+1,0);const s=e.getDate();return o>=s?e:(t.setFullYear(e.getFullYear(),e.getMonth(),o),t)}export{d as C,f as a};
