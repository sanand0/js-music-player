// Globals: DB, euc

// Usage: new RMPlayer('embed#realplayer, object#realplayer', function() { play_next_code(); })
var RMPlayer = function(id, playnext) {
    id = $(id);

    // Loop through all objects and find something that has the required functions
    for (var i=0, l=id.length; i<l && !this.hasReal; i++) {
        this.player = $(id).get(i);
        try { this.player.GetPlayState(); this.hasReal = 1; }       // RealPlayer is the object that has .GetPlayState()
        catch(e) { this.hasReal = 0; }
    }
    if (!this.hasReal) {                                            // If we don't have RealPlayer, report error
        $(id).replaceWith("Browser does not support RealPlayer. Songs won't play continuously.");
    } else {
        this.isPlaying = 0;         // 1 if the player is currently playing
        this.playnext = playnext;   // Function to call to play next song
        this.justStarted = 0;       // 1 if within 1st few seconds of song having started. Don't playnext() if justStarted and song still hasn't loaded
        this.cache = {};            // cache song json info
        var that = this;
        this.skipAds = function() { that.player.DoNextEntry(); };
        this._playcheck = function() {
            if (that.isPlaying && that.player.GetPlayState() === 0) {
                if (that.justStarted && that.data.real.length) { that._rmplay(that.data.real.shift()); }
                else { that.playnext(); }
            }
            that.justStarted = 0;
        };
        this.player.SetWantErrors(1);
    }
};

$.extend(RMPlayer.prototype, {
    play: function(song) {
        this.isPlaying = 1;
        $('.click_pause').show(); $('.click_play').hide();
        if (song) {
            var that = this;
            $.getJSON('/' + DB.lang + '/' + euc(song) + '/json', function(data) {
                that.data = that.cache[song] = that.cache[song] ? $.merge(that.cache[song], data) : data;
                if (data.real.length) { that._rmplay(data.real.shift()); }
                else { that.playnext(); }
            });
        } else if (this.player.CanPlay()) {
            this.player.DoPlay();
        }
    },
    _rmplay: function(url) {
        this.player.DoStop();
        this.player.SetSource(url);
        this.player.DoPlay();
        this.skipAds.schedule(1000, 1000, 1000);
        this.justStarted = 1;
        this._playcheck.schedule(10000, -1000);
    },
    pause: function() {
        this.player.DoPause();
        this.isPlaying = 0;
        $('.click_pause').hide(); $('.click_play').show();
    },
    vol:  function(percent) {
        var v = this.player.GetVolume(),
            incr = Math.round(percent * v);
        if (incr === 0) { incr = percent < 0 ? -1 : percent > 0 ? +1 : 0; }
        v = v + incr;
        v = v < 0 ? 0 : v > 100 ? 100 : v;
        this.player.SetVolume(v);
        $("#volume").html(v);
    },
    seek: function(incr) {
        var v = this.player.GetPosition() + incr * 1000;
        if (v < 0) { v = 0; }
        this.player.SetPosition(v);
    }
});

// Merge two objects with similar structure. Very conservative. Does not change the first object if it's already filled, or if there's ANY incompatibility.
$.merge = function(a,b) {
    if (typeof a == "object" && typeof b == "object") {
        if (a instanceof Array && b instanceof Array) {
            for (var i=0, l=b.length; i<l; i++) {
                if ($.inArray(b[i], a) < 0) { a.push(b[i]); }
            }
        } else {
            for (var key in b) { if (b.hasOwnProperty(key)) {
                if (!a[key]) { a[key] = b[key]; }
                else { $.merge(a[key], b[key]); }
            } }
        }
    }
    return a;
};