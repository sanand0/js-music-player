// Globals: obj (created by drag)

var euc = document.encodeURIComponent || window.escape,
    duc = document.decodeURIComponent || window.unescape;

function   bind(o,e,fn) { return o.addEventListener    ? o.addEventListener(e,fn,false)    : o.attachEvent ? o.attachEvent('on'+e,fn) : ""; }
function unbind(o,e,fn) { return o.removeEventListener ? o.removeEventListener(e,fn,false) : o.detachEvent ? o.detachEvent('on'+e,fn) : ""; }
function    tgt(e) { e = e || window.event; var target = e.target || e.srcElement; if (target.nodeType == 3) { target = target.parentNode; } return target; }
function cancel(e) { e = e || window.event; if (e.preventDefault) { e.preventDefault(); } e.cancelBubble = e.returnValue = false; return false; }

function offset(o) {
    var l = o.offsetLeft, t = o.offsetTop;
    while (o = o.offsetParent) { l += o.offsetLeft; t += o.offsetTop; }
    return {left:l, top:t};
}

function move(e) {
    var pos,
        prv = obj.previousSibling,
        nxt = obj.nextSibling,
        par = obj.parentNode,
        y = e.pageY || (e.clientY + document.body.scrollTop + document.documentElement.scrollTop);
    if (prv) { pos = offset(obj); if (y < pos.top) { par.removeChild(obj); par.insertBefore(obj, prv); } }
    if (nxt) { pos = offset(nxt); if (y > pos.top) { par.removeChild(obj); var x = nxt.nextSibling ? par.insertBefore(obj, nxt.nextSibling) : par.appendChild(obj); } }
    return cancel(e);
}

function drop(e) {
    if (obj.className) { obj.className = obj.className.replace(/\s*\bdrag\b\s*/g, ""); }
    unbind(document,"mousemove",move);
    unbind(document,"mouseup",drop);
    return cancel(e);
}

function drag(e) {
    obj = tgt(e);
    while (obj && !obj.className.match(/play/)) { obj = obj.parentNode; }
    bind(document,"mousemove",move);
    bind(document,"mouseup",drop);
    if (obj.className) { obj.className += " drag"; } else { obj.className = "drag"; }
    return cancel(e);
}

Function.prototype.clear = function() {
    var f = this;
    if (f._timeout_id) { clearTimeout(f._timeout_id); }
    if (f._interval_id) { clearInterval(f._interval_id); }
    if (f._timeout_q && f._timeout_q.length) { for (var i=0,l=f._timeout_q.length; i<l; i++) { clearTimeout(f._timeout_q[i]); } }
};
Function.prototype.schedule = function () {
    var f = this,
        args = Array.prototype.slice.call(arguments),
        ms = args.shift();
    f.clear();
    if (ms > 0) { f._timeout_id = setTimeout(   function () { f.schedule.apply(f, args); f(); }, ms); }
    if (ms < 0) { f._interval_id = setInterval( function () { f(); }, -ms); }
};

var onErr = function (report) {
    for (var i=1; i<arguments.length; i++) {
        var args = Array.prototype.slice.call(arguments);
        (function() {
            var object = (typeof args[i] == 'object')   ? args[i] :
                         (typeof args[i] == 'function') ? args[i].prototype : {};
            for (var key in object) {
                if (typeof object[key] == 'function') {
                    (function() {
                        var fn = object[key], str = key, obj = object;
                        object[key] = function() {
                            try { return fn.apply(this, arguments); }
                            catch(e) { report(obj, str, e, Array.prototype.slice.call(arguments)); }
                        };
                    })();
                }
            }
        })();
    }
};

String.prototype.s = String.prototype.replace;
String.prototype.uc = String.prototype.toUpperCase;
var Trans = {
    hindi: function (str) { return str.uc().
        s(/[^A-Z0-9~\.\*\|\^\$\s]/g, '').
                                                                // Simple consonant substitutions
        s(/W/g, 'V').
        s(/KSH/g, 'X').
        s(/Z/g, 'J').
        s(/PH/g, 'F').
                                                                // Simple vowel substitutions
        s(/[AE]I/g, 'E').
        s(/AYE*/g, 'E').
        s(/EE/g, 'I').
        s(/OO/g, 'U').
        s(/AU/g, 'OU').

        s(/(.)\1\1*/g, '$1').                                   // Merge repeated letters
        s(/([KGCJMNTDPBS])\1*H\1*H*/g, '$1').                   // xH -> x (accounting for duplications, e.g. CHCH -> C)
        s(/\bH(\w)/g, '$1').                                    // Remove leading H (HAI -> AI)
        s(/(\w)H\b/g, '$1').                                    // Remove trailing H (SOLVAH -> SOLVA)
        s(/([AEIOU])N\b/g, '$1').                               // Remove trailing N if following a vowel (HAIN -> HAI)
        s(/([BCDFGHJKLMNPQRSTVWXYZ])[AEIOUH]*\b/g, '$1').       // Powerful rule. Says ignore the last vowels or H of every word. Be careful. (Weaker form: s/R[AEI]/R/)
        s(/Y/g, '').                                            // Ignore Y
        s(/\s/g, '');                                           // Ignore spaces
    },
    tamil: function(str) { return str.uc().
        s(/[^A-Z0-9~\.\*\|\^\$\s]/g, '').
        s(/\s/g, '').
        s(/AI?Y/g, 'E').
        s(/AE/g, 'E').
        s(/E[AIY]/g, 'E').
        s(/IE/g, 'I').
        s(/Y/g,  'I').
        s(/OOO*/g, 'U').
        s(/O[AE]/g, 'O').
        s(/AO/g, 'O').
        s(/AU/g, 'OU').
        s(/I([AOU])/g, 'IY$1').
        s(/OVI/g, 'OI').
        s(/([AEIOU])H([AEIOU])/g, '$1K$2').
        s(/KSH/g, 'S').
        s(/TCH/g, 'S').
        s(/CH/g,  'S').
        s(/N[DT]R/g, 'NR').
        s(/H/g, '').
        s(/W/g, 'V').
        s(/G/g, 'K').
        s(/D/g, 'T').
        s(/B/g, 'P').
        s(/TIR/g, 'TR').
        s(/([A-Z])\1\1*/g, '$1');
    }
};


// Usage:
// trySearch("NAAYAGAN Andhi Mazhai",trySearch("NAAYAGAN"))(node, new google.search.VideoSearch(), 6);
function trySearch(text, onfail) {
    return function(node, searcher, count, shown) {
        shown = shown || {};
        searcher.setResultSetSize(google.search.Search.LARGE_RESULTSET);
        searcher.setNoHtmlGeneration();
        searcher.setSearchCompleteCallback(null, function(result) {
            for (var i=0, result; (count > 0) && (result = searcher.results[i]); i++) {
                if (!shown[result.tbUrl]) {
                    var w = result.tbWidth || result.width,
                        h = result.tbHeight || result.height,
                        nh = 100,
                        nw = Math.round(w * nh / h, 0);
                    // Show only if the 0.5 < width / height < 2 . Don't want anything with weird aspect ratios
                    if ((nh <= 2*nw) && (nw <= 2*nh)) {
                        node.prepend("<a target='_blank' href='" + (result.originalContextUrl || result.url) + "' title='" +
                            (result.contentNoFormatting || result.content).replace(/'/g, '\\') + "'>" +
                            "<img src='" + (result.unescapedUrl || result.tbUrl) +
                            "' title='" + result.titleNoFormatting + (result.duration ? " (" + timeFormat(result.duration) + ")" : "") +
                            "' width='" + nw +
                            "' height='" + nh + "'></a>");
                        shown[result.tbUrl] = 1;
                        count--;
                    }
                }
            }
            if (count > 0 && typeof onfail == "function") { onfail(node, searcher, count, shown); }
            else { node.find("img.loading").remove(); }
        });
        searcher.execute(text);
    }
}

function timeFormat(s) {
    var min = Math.round(s / 60), sec = s % 60;
    return min + ":" + (sec < 10 ? "0" + sec : sec);
}
