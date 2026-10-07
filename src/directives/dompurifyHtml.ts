import {buildVueDompurifyHTMLDirective} from 'vue-dompurify-html';

/**
 * v-dompurify-html, imported by the few components that render API HTML (news,
 * store items, the news editor) so DOMPurify stays out of every other page's bundle.
 */
export const vDompurifyHtml = buildVueDompurifyHTMLDirective();
