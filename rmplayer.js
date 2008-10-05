// Globals: DB, euc

var RMPlayer = function(id, playnext) {
    id = $(id);

    // Loop through all objects and find something that has the required functions
    for (var i=0, l=id.length; i<l && !this.hasReal; i++) {
        this.player = $(id).get(i);
        try { this.player.GetPlayState(); this.hasReal = 1; }
        catch(e) { this.hasReal = 0; }
    }
    if (!this.hasReal) {
        $(id).replaceWith("Browser does not support RealPlayer. Songs won't play continuously.");
    } else {
        this.isPlaying = 0;
        this.playnext = playnext;
        this.justStarted = 0;
        var that = this;
        this.skipAds = function() { that.player.DoNextEntry(); };
        this._playcheck = function() {
            if (that.isPlaying && that.player.GetPlayState() === 0) {
                if (that.justStarted && that.data.real.length) { that._rmplay(that.data.real.shift()); }
                else { that.playnext(); }
            }
            that.justStarted = 0;
        };
    }
};

$.extend(RMPlayer.prototype, {
    play: function(song) {
        this.isPlaying = 1;
        $('.click_pause').show(); $('.click_play').hide();
        if (song) {
            var that = this;
            $.getJSON('/' + DB.lang + '/' + euc(song) + '/json', function(data) {
                that.data = data;
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
    vol:  function(incr) {
        var v = this.player.GetVolume() + incr;
        if (v < 0) { v = 0; }
        else if (v > 100) { v = 100; }
        this.player.SetVolume(v);
        $("#volume").html(v);
    },
    seek: function(incr) {
        var v = this.player.GetPosition() + incr * 1000;
        if (v < 0) { v = 0; }
        this.player.SetPosition(v);
    }
});

