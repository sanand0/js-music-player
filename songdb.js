// Globals: Trans

/*
    Learnings: (DO NOT DELETE)

    # Searching through an array of strings is faster than searching one long string (factor of 4-6)
    # Searching using an new RegExp() is faster than string.match() (factor of 2-3)
    # Case sensitive search is faster than case insensitive search (25%)
    # You need an array of strings of the form 'movie~song'.
    # Load as a single string and split. Translating an array of strings takes forever (factor of 15-20)
    # The bulk of the time is spent in translating

    # Regular expressions: | is very slow. Split into multiple regular expressions.
    # Regular expressions: ? is slow. Avoid it.
    # Regular expressions: Character classes are pretty fast. Use them.
*/

var SongDb = function(lang) {
    this.lang = lang;
    this.trans = lang.match('hindi') ? Trans.hindi : Trans.tamil;
    this.mp3 = lang.match('mp3') ? 1 : 0;
};

$.extend(SongDb.prototype, {
    loadsong: function(str) {
        this.song = str.split('^');
        this.tran = this.trans(str).split('^');
    },

    loadmovie: function(str) {
        this.movie = str.split('^');
    },
                                              // words                 arr         out         tr          fn  obj pos found maxfind  time
    searchsong:     function(phrase, fn, obj) { this._search([phrase], this.tran,  this.song,  this.trans, fn, obj,  0,    0,    100,  200); },
    searchmovie:    function(phrase, fn, obj) { this._search([phrase], this.movie, this.movie, "i",        fn, obj,  0,    0,    300,    0); },

    /*
        words   = array of strings to search for. All of them should exist in...
        arr     = array of strings to search in.
        out     = array that contains the results. One-to-one mapping with arr
        tr     = transformation function to be applied on the words when searching
        fn      = results function. Called when results are gathered. Must take an array as input
        obj     = results object -- the 'this' of the results function
        pos     = position to start searching from. Defaults to 0
        found   = number found so far. Search goes on till ...
        maxfind = maximum number of results to find
        time    = milliseconds to run this function in
     */
    _search: function(words, arr, out, tr, fn, obj, pos, found, maxfind, time) {
        if (this._timout) { clearTimeout(this._timout); }
        var that = this;
        this._timout= setTimeout(function() {
            that._searchnow(words, arr||[], out||[], tr, fn, obj, pos, found, maxfind);
        }, time || 0);
    },

    _searchnow: function(words, arr, out, tr, fn, obj, pos, found, maxfind) {
        var n = words.length, re = [], results = [], i,
            end = arr.length - pos > 20000 ? pos + 20000 : arr.length;                  // Don't search beyond 20000 entries at a time. Takes too long

        if (typeof tr == "function") { for (i=0; i<n; i++) { re[i]=new RegExp(tr(words[i])); } }   // Create regular expressions (faster than string.match)
        else                         { for (i=0; i<n; i++) { re[i]=new RegExp(words[i], tr); } }   // Use translations if specified, if not, use flags

        for (; (pos < end) && (found < maxfind); pos++) {                               // Loop from current position to end
            var word = arr[pos], match = 1;
            for (var j=0; j<n; j++) { if (!re[j].test(word)) { match = 0; break; } }    // Check each word
            if (match) { results[results.length] = out[pos]; found++; }                 // If found, store the result
            if (results.length > maxfind) { break; }                                    // If we've got enough results, quit.
        }

        if (results.length > 0) { fn.call(obj, results); }                              // If we found any results, send them for display

        if (found < maxfind) {                                                                              // If we haven't found enough
            if (pos < arr.length) { this._search(words, arr, out, tr, fn, obj, pos, found, maxfind, 20); }  // Try continuing the current search in 20ms
            else if (!found && words[0].match(/\s/)) {                                                      // Or else, break up the phrase into words and continue
                words = words[0].split(/\s+/).sort(function(a,b) { return a.length < b.length ? 1 : a.length > b.length ? -1 : 0; });   // Sort largest words first to fail fast
                this._search(words, arr, out, tr, fn, obj, 0, found, maxfind, 20);                          // Search in 20ms
            }
        }
    }
});
