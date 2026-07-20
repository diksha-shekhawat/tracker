const fs = require('fs');

// Mock DOM
const document = {
    addEventListener: (event, cb) => {
        if (event === 'DOMContentLoaded') {
            setTimeout(cb, 10);
        }
    },
    getElementById: () => ({
        addEventListener: () => {}
    })
};

const window = {
    localStorage: {
        store: {},
        getItem: function(k) { return this.store[k] || null; },
        setItem: function(k, v) { this.store[k] = v; },
        removeItem: function(k) { delete this.store[k]; }
    }
};
global.localStorage = window.localStorage;

let dataJs = fs.readFileSync('data.js', 'utf8');
eval(dataJs);

let appJs = fs.readFileSync('app.js', 'utf8');
// Stub out DOM manipulation
appJs = appJs.replace(/function updateApp\(\) \{[\s\S]*?\}/, 'function updateApp() { console.log("updateApp called"); }');
appJs = appJs.replace(/function setupEventListeners\(\) \{[\s\S]*?\}/, 'function setupEventListeners() { console.log("setupEventListeners called"); }');

try {
    eval(appJs);
    console.log("App loaded successfully without infinite loops or synchronous errors.");
} catch(e) {
    console.error("Runtime error:", e);
}
