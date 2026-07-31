import "./assets/main.css";

import {createApp} from "vue";
import {createPinia} from "pinia";
import VueCookies from "vue-cookies";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
let sanitizerInstalled = false;
let fontAwesomeInstalled = false;
router.beforeEach(async (to) => {
    if (to.path !== '/' && !fontAwesomeInstalled) {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
        stylesheet.crossOrigin = 'anonymous';
        stylesheet.referrerPolicy = 'no-referrer';
        document.head.append(stylesheet);
        fontAwesomeInstalled = true;
    }
    if (!sanitizerInstalled && /^(news-article|news-article-localized|service-detail|edit-news)$/.test(String(to.name))) {
        const {default: VueDOMPurifyHTML} = await import('vue-dompurify-html');
        app.use(VueDOMPurifyHTML);
        sanitizerInstalled = true;
    }
});
app.use(router);
app.use(VueCookies);

window.$cookies = VueCookies.VueCookies;

app.mount("#app");

// Performance monitoring in development
if (import.meta.env.DEV) {
    console.log('🚀 Performance monitoring enabled in development mode');

    // Monitor long tasks that could cause jank
    if ('PerformanceObserver' in window) {
        try {
            const longTaskObserver = new PerformanceObserver((entries) => {
                entries.getEntries().forEach((entry) => {
                    if (entry.duration > 50) {
                        console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`, {
                            startTime: entry.startTime.toFixed(2),
                            duration: entry.duration.toFixed(2),
                            name: entry.name
                        });
                    }
                });
            });
            longTaskObserver.observe({entryTypes: ['longtask']});

            // Monitor largest contentful paint
            const lcpObserver = new PerformanceObserver((entries) => {
                const lcpEntry = entries.getEntries()[entries.getEntries().length - 1];
                console.log(`📊 LCP: ${lcpEntry.startTime.toFixed(2)}ms`);
            });
            lcpObserver.observe({entryTypes: ['largest-contentful-paint']});

            // Monitor cumulative layout shift
            const clsObserver = new PerformanceObserver((entries) => {
                let clsValue = 0;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                entries.getEntries().forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                if (clsValue > 0) {
                    console.log(`📏 CLS: ${clsValue.toFixed(4)}`);
                    if (clsValue > 0.1) {
                        console.warn(`⚠️ High CLS detected: ${clsValue.toFixed(4)} (should be < 0.1)`);
                    }
                }
            });
            clsObserver.observe({entryTypes: ['layout-shift']});

            // Monitor first input delay
            const fidObserver = new PerformanceObserver((entries) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                entries.getEntries().forEach((entry: any) => {
                    console.log(`⚡ FID: ${entry.processingStart - entry.startTime}ms`);
                    if (entry.processingStart - entry.startTime > 100) {
                        console.warn(`⚠️ High FID detected: ${(entry.processingStart - entry.startTime).toFixed(2)}ms (should be < 100ms)`);
                    }
                });
            });
            fidObserver.observe({entryTypes: ['first-input']});

        } catch (error) {
            console.log('Performance monitoring setup failed:', error);
        }
    }

    // Monitor memory usage (Chrome only)
    if ('memory' in performance) {
        const logMemory = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const memory = (performance as any).memory;
            console.log(`💾 Memory: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB used / ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB total`);
        };

        // Log memory usage every 30 seconds
        setInterval(logMemory, 30000);

        // Initial memory log
        setTimeout(logMemory, 2000);
    }

    // Log application startup time
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            console.log(`🕐 App startup metrics:`, {
                'DNS Lookup': `${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms`,
                'TCP Connection': `${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms`,
                'Server Response': `${(perfData.responseEnd - perfData.requestStart).toFixed(2)}ms`,
                'DOM Interactive': `${perfData.domInteractive.toFixed(2)}ms`,
                'DOM Complete': `${perfData.domComplete.toFixed(2)}ms`,
                'Load Event': `${perfData.loadEventEnd.toFixed(2)}ms`,
                'Total Load Time': `${perfData.loadEventEnd.toFixed(2)}ms`
            });
        }, 1000);
    });
}
