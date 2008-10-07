// Globals: DB, Player, Star, drag, euc, trysearch, google

$.fn.showTab = function() {
    var that = this[0], id;
    $('.tab').each(function() {
        if (that == this) { id = $(this).show().addClass   ('activetab').attr('id'); $('#show_' + id).addClass   ('activetab'); }
        else              { id = $(this).hide().removeClass('activetab').attr('id'); $('#show_' + id).removeClass('activetab'); }
    });
    return this;
};

var View = {
    removeSongHTML: '<a href="#" title="Remove this song" class="remove">x</a> ',   // A HTML fragment that's used to remove a song from a list.
    loadingHTML: '<img class="loading" src="/i/loading-small.gif">',                // A HTML fragment for loading
    lastsearch: '',                                                                 // Last search string

    // song('movie~song'): Converts it to <div class='play'><a class='song'>song</a> | <a class='movie'>movie</a></div>
    song: function(str) {
        var ms = str.replace('"', '&quot;').split('~'),
            url = '/' + DB.lang + '/' + str + '/play" target="newsong';
        return '<div class="play" song="' + str + '">' +
                (ms[1] ? '<a class="getsongs" href="#">' + ms[0] + '</a> | <a class="song" href="' + url + '">' + ms[1] + '</a>'
                       :  '<a class="song" href="' + url + '">' + ms[0] + '</a>') +
               '</div>';
    },

    // movie('movie~year~composer~lyrics~actor'): Converts it to <div class='play'><a class='movie'>movie</a> | <a class='year'>year</a> | <a class='music'>composer</a> | ...</div>
    movie: function(str) {
        var myd = str.split('~');
        return '<div class="movie-info"><a href="#" class="getsongs">'    + myd[0] + '</a>' +
            (myd[1] ? ' | <a href="#" class="year">'    + myd[1] + '</a>' : '') +
            (myd[2] ? ' | <a href="#" class="music">'   + myd[2] + '</a>' : '') +
            (myd[3] ? ' | <a href="#" class="lyrics">'  + myd[3] + '</a>' : '') +
            (myd[4] ? ' | <a href="#" class="actor">'   + myd[4] + '</a>' : '') + '</div>';
    },

    // View.addmovie(['movie~song', 'movie~song', ...]): Add the list of songs to the results tab, and show the results tab
    addsong: function(songs) {
        for (var html = [], i=0, l=songs.length; i<l; i++) { html[html.length] = this.song(songs[i]); }
        $('#results .songs').append(html.join(''));
        $('#results').showTab();
    },

    // View.refreshrecent('movie~song\nmovie~song\n...'): Adds songs to the recent tab and shows it
    refreshrecent: function() {
        var that = this;
        $('#recent .songs').html('<img src="/i/loading-small.gif">');
        $.ajax({
            url: '/db/song/recent.' + DB.lang,
            success: function(songs) {
                $('#recent .songs').html('');
                for (var list = songs.split('\n').reverse(), done = {}, count=0, i=0, l=list.length; i<l; i++) {
                    var v = list[i];
                    if (v && !done[v]) {
                        $('#recent .songs').append(that.song(v));
                        done[v] = 1;
                        if (count++ >= 100) { break; }
                    }
                }
            },
            cache: false
        });
    },

    // View.addmovie(['movie~year~composer', 'movie~year~composer', ...]): Add the list of movies to the results tab, and show the results tab
    addmovie: function(movies) {
        for (var html = [], i=0, l=movies.length; i<l; i++) { html[html.length] = this.movie(movies[i]); }
        $('#results .songs').append(html.join(''));
        $('#results').showTab();
    },

    // clearsearch(): Clears the search results
    clearsearch: function() { $('#results .songs').html(''); },

    // View.hashsearch(): Set the value at #search to the location hash and then search
    hashsearch: function() {
        var val = document.location.hash.replace('#', '');
        $('#search').val(val);
        this.search(val);
    },

    // View.search(str): Searches for the string in the songs and shows the results
    search: function(val) {
        val = val.replace(/^\s*/, '').replace(/\s*$/, '');                      // Get the val and trim spaces
        if (val !== this.lastsearch) {                                          // Trigger change event only if the string has changed
            this.lastsearch = val;                                              // Reset value of last search
            document.location.hash = '#' + val;
            this.clearsearch();
            var command = this.lastsearch.match(/^(movie|year|music|actor|lyrics):(..*)$/);
            if (command) {
                if (command[1] == 'movie') { DB.searchmovie('^' + command[2], this.addmovie, this); }
                else                       { DB.searchmovie('~' + command[2], this.addmovie, this); }
            }
            else if (this.lastsearch) { DB.searchsong(this.lastsearch, this.addsong, this); }
        }
    },


    // View.addstars(['movie~song', 'movie~song', ...]): Clears the current list of stars and adds items from a new list.
    addstars: function(songs) {
        songs = songs.sort(function(a,b) { x = a.uc(); y = b.uc(); return (x<y) ? -1 : (x>y) ? 1 : 0; }); // Sort ascending, case insensitive
        for (var html = [], i=0, l=songs.length; i<l; i++) {                                            // Loop through
            if (!i || songs[i] != songs[i-1]) {                                                         // Eliminate duplicates
                html[html.length] = this.song(songs[i]);                                                // Create the song string
            }
        }
        $('#favourites .songs').html(html.join(''));                                                    // Insert the song string into DOM
        $('#favourites .songs .play').prepend(this.removeSongHTML);                                     // To each song, prepend the 'x' to remove the song
    },

    // View.addstar('movie~song'): If song is not already starred, star it.
    addstar: function(song) {
        if (!$('#star .play[song=' + song + ']').length) {                                                  //  If the song is not already in the star list
            $(this.song(song)).prepend(this.removeSongHTML).prependTo('#star');                             //      Add the song to the screen
            Star.add(song);                                                                                 //      Add the song to the server
            $('#show_favourites').css({backgroundColor: '#fdd', color: '#000'});                            //      Flash the favourites tab
            setTimeout(function() { $('#show_favourites').css({backgroundColor: '', color: ''}); }, 1000);
            if (this.menuElement) { this.notify(this.menuElement, 'Added to favourites'); }                 //      Notify the user
        } else if (this.menuElement) { this.notify(this.menuElement, 'Already in favourites'); }            //  If the song was already in the star list, notify the user
    },

    // removestar($('.play').eq(0)): Removes a starred song (class='play') from the starred list
    removestar: function(el) { Star.del(el.attr('song')); el.remove(); },

    // View.showMenu($('.song').eq(0)): Shows context menu next to a song (class='song')
    showMenu: function(target) {
        this.menuElement = target.parent();                                                                 // Save the .play parent for future reference (used by View.addstar)
        var song = target.parent().attr('song'),
            ms = song.split('~'),
            offset = target.offset();
        offset.left += 10;                                                                                  // Show the menu 10px to the right of the song's left edge
        offset.top += target.height();
        $('#Star, #Info').attr('song', song);                                                               // Set the HREFs directly, to avoid popup blockers
        $('#Download'   ).attr('href', '/' + DB.lang + '/' + euc(song) + '/download');
        $('#Popup'      ).attr('href', Player.cache[song].html.shift() || '/' + DB.lang + '/' + euc(song) + '/play');
        $('#Mail'       ).attr('href', '/mplayer-mail.html?lang=' + DB.lang + '&movie=' + euc(ms[0]) + '&song=' + euc(ms[1]));
        $('#menu').css(offset).show();
        var that = this;
        $(document).one('click', function() { that.hideMenu(); });                                          // Any time we click somewhere, the menu will vanish
    },

    // View.hideMenu(): hide the menu
    hideMenu: function() { $('#menu').hide(); delete this.menuElement; },

    // View.notify($('.play').eq(0), msg): Shows a message against a song (class='play') for a short while
    notify: function(el, msg) {                                                         // Show a notification message right-aligned against the element
        var notify = $('#notify').html(msg).css('width', 'auto').height(el.height()-2); // 2 = margin-top + margin-bottom + border-top + border-bottom
        var offset = el.offset();
        offset.left += el.width() - notify.width() - 9;                                 // 8 = margin-left + margin-right + border-left + border-right + 1
        offset.top += 2;                                                                // 2 = border-top + 1
        notify.css(offset).show();
        this._hideNotify.schedule(1500);                                                // After 1.5 seconds, start fading out.
        return el;
    },

    // Internal method to hide the notification
    _hideNotify: function() { $('#notify').fadeOut(1000); },

    // View.addplaylist($('.play').eq(0)): Adds a song (class='play') to the playlist if it's not already in there. Starts playing if nothing's playing
    addplaylist: function(el) {
        if (!$('#playlist .play[song=' + el.attr('song') + ']').length) {               // If the song is not already in the playlist
            var s = $(this.song(el.attr('song'))).prepend(this.removeSongHTML).         // Add a new .play element...
                appendTo('#playlist .songs').mousedown(drag);                           // ... to the playlist, and make it draggable
            this.notify(el, 'Queued in playlist');                                      // Notify the user that the item has been added
            $('#playlist .if').show();                                                  // Show everything that's
            if (!Player.isPlaying) { this.playpause(s); }                               // If player isn't playing, start playing this song
        } else {
            this.notify(el, 'Song already in playlist');                                // Notify the user that the item has been added
       }
    },

    clearplaylist: function() {
        $('#playlist .songs').html('');
        $('#playlist .if').hide();
    },

    // View.playpause($('.play').eq(0)): Plays the song, unless it's already playing
    // View.playpause(): Equivalent of pressing the "Play" or "Pause" button.
    //      Pauses if a song is played. Plays current song if it exists. If not, plays first song on playlist.
    playpause: function(el) {
        if (el) {                                                                       // If user had clicked on a song
            if (!el.is('.current')) {                                                   //  and it's not the currently playing song,
                $('#playlist .current').removeClass('current');                         //      Remove the current tag from the previous song
                Player.play(el.addClass('current').attr('song'));                       //      Play the song, and mark it as current
                this.notify(el, 'Playing song');                                        //      Tell the user the song is playing
            } else if (!Player.isPlaying) { Player.play(); }                            //  If it's the currently playing element, but the player is paused, restart it
            else { this.notify(el, 'Song is already playing'); }                        //  If it's the currently playing element and the player is already playing it, tell the user
        }
        else if (Player.isPlaying) { Player.pause(); }                                  // If user had pressed 'P' or the pause control, pause it
        else {                                                                          // If user had pressed 'P' or the play control
            var playlist = $('#playlist .play');
            if (playlist.is('.current')) { Player.play(); }                             //  Play the song if there's something current
            else { Player.play(playlist.eq(0).addClass('current').attr('song')); }      //  If not, play the first song
        }
    },

    // View.playnext(): Plays the next song on the playlist. If there's no current song, plays the first song. If there's no next song, stops playing.
    playnext: function() {
        var current = $('#playlist .current').eq(0);
        if (!current.length) { Player.play($('#playlist .play').eq(0).addClass('current').attr('song')); }
        else if (!current.next().length) { Player.pause(); }
        else { Player.play(current.removeClass('current').next().addClass('current').attr('song')); }
    },

    // View.searchInit(): Initialises Google AJAX search objects
    searchInit: function() {
        this.video_search = new google.search.VideoSearch();
        this.image_search = new google.search.ImageSearch();
        this.image_search.setRestriction(google.search.ImageSearch.RESTRICT_IMAGESIZE, ["medium", "large", "xlarge", "xxlarge", "huge"]);
    },

    // View.showInfo(song): Shows information about song on the info tab
    showInfo: function(song) {
        $('#info .header').html(this.song(song));
        $('#info').showTab();
        $('#info-videos,#info-images,#info-lyrics').html(this.loadingHTML);
        if (this.video_search) { trySearch(song.replace('~', ' '), trySearch(song.replace(/~.*/, '')))($('#info-videos'), this.video_search, 6); }
        if (this.image_search) { trySearch(song.replace('~', ' '), trySearch(song.replace(/~.*/, '')))($('#info-images'), this.image_search, 6); }
    }
};
