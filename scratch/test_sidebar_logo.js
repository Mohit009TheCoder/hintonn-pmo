// Verification Test Suite for Top-Left Application Logo
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('RUNNING TOP-LEFT APPLICATION LOGO VERIFICATION SUITE');
console.log('================================================================\n');

// 1. Verify Image Asset exists on disk
const assetPath1 = path.join(__dirname, '..', 'assets', 'WhatsApp Image 2026-09-21 at 3.13.45 PM_2.jpeg');
const assetPath2 = path.join(__dirname, '..', 'WhatsApp Image 2026-09-21 at 3.13.45 PM_2.jpeg');
if (!fs.existsSync(assetPath1)) {
  throw new Error(`Logo asset missing at: ${assetPath1}`);
}
console.log('✔ Logo asset confirmed present in assets folder:', assetPath1);

// 2. Check Static index.html branding container and img replacement
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
if (!indexHtml.includes('id="top-brand-area"') && !indexHtml.includes('class="sidebar-header"')) {
  throw new Error('index.html missing top-left branding container (.sidebar-header / #top-brand-area)!');
}
if (!indexHtml.includes('WhatsApp Image 2026-09-21 at 3.13.45 PM_2.jpeg')) {
  throw new Error('index.html does NOT reference WhatsApp Image 2026-09-21 at 3.13.45 PM_2.jpeg!');
}
console.log('✔ index.html contains top branding container and references official logo asset');

// 3. Check CSS layout styling in css/layout.css
const layoutCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'layout.css'), 'utf8');

// Check container styles
const containerStyles = [
  'display: flex;',
  'align-items: center;',
  'justify-content: space-between;',
  'padding: 18px 20px;',
  'min-height: 70px;',
  'background-color: #FFFFFF;'
];
containerStyles.forEach(rule => {
  if (!layoutCss.includes(rule)) {
    throw new Error(`layout.css missing required container rule: ${rule}`);
  }
});
console.log('✔ Parent branding container styling verified (display: flex, align-items: center, justify-content: space-between, padding: 18px 20px, min-height: 70px, background-color: #FFFFFF)');

// Check logo img styles
const imgStyles = [
  'height: 44px;',
  'width: auto;',
  'max-width: 220px;',
  'object-fit: contain;',
  'display: block;',
  'image-rendering: -webkit-optimize-contrast;',
  'mix-blend-mode: multiply;',
  'background: transparent !important;'
];
imgStyles.forEach(rule => {
  if (!layoutCss.includes(rule)) {
    throw new Error(`layout.css missing required logo img rule: ${rule}`);
  }
});
console.log('✔ Logo img styling verified (44px height, 220px max-width, contain, block, -webkit-optimize-contrast, mix-blend-mode: multiply, background: transparent !important)');

// 4. Test Dynamic Sidebar Component Execution
// Mock browser globals
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

let sidebarHeaderHtml = '';
let sidebarNavHtml = '';

global.document = {
  body: { style: {}, classList: { add(){}, remove(){}, contains(){ return false; } } },
  getElementById(id) {
    if (id === 'sidebar-header' || id === 'top-brand-area') {
      return {
        get innerHTML() { return sidebarHeaderHtml; },
        set innerHTML(val) { sidebarHeaderHtml = val; },
        style: {}
      };
    }
    if (id === 'sidebar-nav') {
      return {
        get innerHTML() { return sidebarNavHtml; },
        set innerHTML(val) { sidebarNavHtml = val; },
        style: {}
      };
    }
    return { innerHTML: '', style: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } } };
  },
  querySelector(sel) {
    if (sel === '.sidebar-header' || sel === '#top-brand-area') {
      return {
        get innerHTML() { return sidebarHeaderHtml; },
        set innerHTML(val) { sidebarHeaderHtml = val; },
        style: {}
      };
    }
    return { innerHTML: '', style: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } } };
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

global.window = {
  location: { hash: '#dashboard' },
  addEventListener() {},
  innerWidth: 1440
};

// Load scripts
const files = [
  'js/store.js',
  'js/auth.js',
  'js/components/icons.js',
  'js/components/sidebar.js',
  'js/components/topbar.js',
  'js/app.js'
];
files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

Store.init();
Auth.init();
Auth.login('Preet', 'preet@123');

// Render Sidebar dynamically
Sidebar.render();

if (!sidebarHeaderHtml.includes('WhatsApp Image 2026-09-21 at 3.13.45 PM_2.jpeg')) {
  throw new Error('Sidebar.render() did not produce an <img> with WhatsApp Image 2026-09-21 at 3.13.45 PM_2.jpeg!');
}
if (sidebarHeaderHtml.includes('sidebar-brand-title') || sidebarHeaderHtml.includes('sidebar-logo-icon')) {
  throw new Error('Sidebar.render() still contains obsolete generic SVG/text elements!');
}
console.log('✔ Sidebar.render() dynamically renders the official logo img cleanly without generic SVG icon or text element');

console.log('\n================================================================');
console.log('ALL TOP-LEFT APPLICATION LOGO TESTS PASSED SUCCESSFULLY! 🚀');
console.log('================================================================');
