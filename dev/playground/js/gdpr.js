
var gdprAppliesGlobally = true;
(function () { function n() { if (!window.frames.__cmpLocator) { if (document.body && document.body.firstChild) { var e = document.body; var t = document.createElement("iframe"); t.style.display = "none"; t.name = "__cmpLocator"; e.insertBefore(t, e.firstChild) } else { setTimeout(n, 5) } } } function e(e, t, n) { if (typeof n !== "function") { return } if (!window.__cmpBuffer) { window.__cmpBuffer = [] } if (e === "ping") { n({ gdprAppliesGlobally: gdprAppliesGlobally, cmpLoaded: false }, true) } else { window.__cmpBuffer.push({ command: e, parameter: t, callback: n }) } } e.stub = true; function t(a) { if (!window.__cmp || window.__cmp.stub !== true) { return } if (!a.data) { return } var r = typeof a.data === "string"; var e; try { e = r ? JSON.parse(a.data) : a.data } catch (t) { return } if (e.__cmpCall) { var i = e.__cmpCall; window.__cmp(i.command, i.parameter, function (e, t) { var n = { __cmpReturn: { returnValue: e, success: t, callId: i.callId } }; a.source.postMessage(r ? JSON.stringify(n) : n, "*") }) } } if (typeof window.__cmp !== "function") { window.__cmp = e; if (window.addEventListener) { window.addEventListener("message", t, false) } else { window.attachEvent("onmessage", t) } } n() })();

window.didomiOnLoad = window.didomiOnLoad || [];
window.didomiOnLoad.push(function (Didomi) {
    // Call other functions on the SDK
    Didomi.configure({
        website: {
            name: 'Didomi',
            vendors: {
                iab: [
                    9,
                    27,
                    25,
                    28,
                    30,
                ],
            },
        },
    });
});

$.getScript("https://sdk.privacy-center.org/loader.js")
    .done(function (script, textStatus) {
        initPlayer();
    })