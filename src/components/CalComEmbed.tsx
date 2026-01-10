'use client';

import { useEffect } from 'react';

export default function CalComEmbed() {
    useEffect(() => {
        (function (C: any, A: string, L: string) {
            let p = function (a: any, ar: any) { a.q.push(ar); };
            let d = C.document;
            C.Cal = C.Cal || function () {
                let cal = C.Cal;
                let ar = arguments;
                if (!cal.loaded) {
                    cal.ns = {};
                    cal.q = cal.q || [];
                    d.head.appendChild(d.createElement("script")).src = A;
                    cal.loaded = true;
                }
                if (ar[0] === L) {
                    const api: any = function () { p(api, arguments); };
                    const namespace = ar[1];
                    api.q = api.q || [];
                    if (typeof namespace === "string") {
                        cal.ns[namespace] = cal.ns[namespace] || api;
                        p(cal.ns[namespace], ar);
                        p(cal, ["initNamespace", namespace]);
                    } else p(cal, ar);
                    return;
                }
                p(cal, ar);
            };
        })(window, "https://app.cal.com/embed/embed.js", "init");

        const Cal = (window as any).Cal;
        if (Cal) {
            Cal("init", "project-meeting", { origin: "https://app.cal.com" });

            Cal.ns["project-meeting"]("floatingButton", {
                "calLink": "akrix-ai/project-meeting",
                "config": { "layout": "month_view" },
                "buttonText": "Book Call with Team Akrix",
                "buttonColor": "#22c55e", // Green theme
                "buttonTextColor": "#ffffff", // White text
                "buttonPosition": "bottom-left" // Opposite of Tawk.to
            });

            Cal.ns["project-meeting"]("ui", {
                "cssVarsPerTheme": {
                    "light": { "cal-brand": "#e60a0a" },
                    "dark": { "cal-brand": "#e01919" }
                },
                "hideEventTypeDetails": false,
                "layout": "month_view"
            });
        }
    }, []);

    return null;
}
