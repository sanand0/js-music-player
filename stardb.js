// Globals: DB, View, euc, duc

// Cookies
(function() {
    $.cookie = {
        set: function(name, value, days) {
            var date = new Date();
            date.setTime(date.getTime() + (days|| 180) *86400000);
            document.cookie = name + "=" + euc(value) + "; expires=" + date.toGMTString() + "; path=/";
            if (days < 0) { delete this[name]; } else { this[name] = value; }
        }
    };
    var frags = document.cookie.split(/;\s|=/);
    for (var i=0, l=frags.length; i<l; i+=2) { $.cookie[frags[i]] = duc(frags[i+1]); }
})();

var StarDb = function() { this.user($.cookie.mail); };

$.extend(StarDb.prototype, {
    add:    function(song) { if (this.url) { $.get(this.url +   'post&value=' + euc(song)); } return this; },
    del:    function(song) { if (this.url) { $.get(this.url + 'delete&value=' + euc(song)); } return this; },
    user:   function(user) { if (user) {
            $.cookie.set('mail', user, 180);
            this.url = '/e/webdb.php?db=song&key=star.' + $.cookie.mail + "." + DB.lang + '&alt=json&cmd=';
            var songs = $('#favourites .songs .play').map(function() { return $(this).attr('song'); }).get().join("\n");
            if (songs) { this.add(songs); }
            $.getJSON(this.url + 'get', function(data) { View.addstars(data); });
            return this;
        }
    }
});

