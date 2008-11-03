// Globals: DB, euc

// Usage: new RMPlayer('embed#realplayer, object#realplayer', function() { play_next_code(); })
var RMPlayer = function(id, handle) {
    id = $(id);
    this.cache = {};                // cache song json info

    // Loop through all objects and find something that has the required functions
    for (var i=0, l=id.length; i<l && !this.hasReal; i++) {
        this.player = $(id).get(i);
        try { this.player.GetPlayState(); this.player.DoStop(); this.player.DoPlay(); this.hasReal = 1; } // RealPlayer is the object that has the required functions.
        catch(e) { this.hasReal = 0; }
    }
    if (!this.hasReal) {                                            // If we don't have RealPlayer, report error
        $(id).replaceWith('Install <a href="http://www.realplayer.com/">RealPlayer</a> or <a href="http://www.free-codecs.com/real_Alternative_download.htm">Real Alternative</a> to play songs continuously.');
    } else {
        this.handle = function(fn) {
            if (typeof(handle[fn]) == "function") {
                handle[fn].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        };
        this.isPlaying = 0;         // 1 if the player is currently playing
        var that = this;
        this.skipAds = function() { that.player.DoNextEntry(); };
        this._playcheck = function() {
            if (that.isPlaying && that.player.GetPlayState() === 0) {       // If song is supposed to be playing and isn't,
                var now = (new Date()).getTime();
                if (now - that.justStarted > 15000) {                       // If song hasn't played in 15 seconds,
                    if (now - that.justStarted < 30000) {                   // In the 1st 30 seconds, try playing the next realplayer song
                        that.handle('failed', that.data);                   //  Notify the failure
                        if (that.realIndex < that.data.real.length) {       //  Try same song from a different site
                            that._rmplay(that.data.real[that.realIndex++]);
                        } else { that.handle('playnext'); }                 //  Or move to next song
                    } else { that.handle('playnext'); }                     // After 30 seconds, just move on to the next song.
                }
            }
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
                that.data = that.cache[song] = $.combine(that.cache[song] || {}, data);
                that.realIndex = 0;
                if (that.data.real.length) { that._rmplay(that.data.real[that.realIndex++]); }
                else { that.handle('playnext'); }
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
        this.justStarted = (new Date()).getTime();
        this._playcheck.schedule(10000, -1000);
        this.handle('playing', url);
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
        $('#volume').html(v);
    },
    seek: function(incr) {
        var v = this.player.GetPosition() + incr * 1000;
        if (v < 0) { v = 0; }
        this.player.SetPosition(v);
    }
});

// Combine two objects with similar structure. Very conservative. Does not change the first object if it's already filled, or if there's ANY incompatibility.
$.combine = function(a,b) {
    if (typeof a == 'object' && typeof b == 'object') {
        if (a instanceof Array && b instanceof Array) {
            for (var i=0, l=b.length; i<l; i++) {
                if ($.inArray(b[i], a) < 0) { a.push(b[i]); }
            }
        } else {
            for (var key in b) { if (b.hasOwnProperty(key)) {
                if (!a[key]) { a[key] = b[key]; }
                else { $.combine(a[key], b[key]); }
            } }
        }
    } else if (!a) { a = b; }
    return a;
};