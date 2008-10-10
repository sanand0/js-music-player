// Globals: DB, Player, RMPlayer, SongDb, Star, StarDb, View, onErr

// Knuth shuffle. Reorders the elements in a selection randomly.
$.fn.shuffle = function() {
    for (var i=0, l = this.length-1; i<l; i++) {
        var n = Math.floor(Math.random() * (l-i)) + i + 1; // Random number > i, <= l
        var x = this[i]; this[i] = this[n]; this[n] = x;
    }
    return this;
};

function init() {
    $('#search').focus(function(e) { $(this).select(); })                       // Select on focus
                .keyup( function(e) { $(this).trigger('change'); })             // Fire onchange on keyup
                .change(function(e) { View.search($(this).val()); });           // If the search string has changed, refresh the search
    var ev = function (e) { e.preventDefault(); return $(e.target); };
    $('#tabContent,#playlist').click(function(e) { var target = $(e.target);
        if (target.is('.movie'))   { $('#search').val('movie:' + target.text()).trigger('change'); e.preventDefault(); }
        if (target.is('.year'))    { $('#search').val('year:'  + target.text()).trigger('change'); e.preventDefault(); }
        if (target.is('.music'))   { $('#search').val('music:' + target.text()).trigger('change'); e.preventDefault(); }
        if (target.is('.getsongs')){ $('#search').val('^'+ target.text() + '~').trigger('change'); e.preventDefault(); }
        if (target.is('.shuffle')) { $('.activetab .play').shuffle().slice(0,20).each(function() { View.addplaylist($(this)); }); }
    });
    $('#playlist'  ).click(function(e) { var target = $(e.target);
        if (target.is('.song') && Player.hasReal) { View.playpause(target.parent()); e.preventDefault(); }
        if (target.is('.remove'))  { target.parent().remove(); e.preventDefault(); }
        if (target.is('.clear'))   { View.clearplaylist(); e.preventDefault(); }
    });
    $('#tabContent').click(function(e) { var target = $(e.target); if (target.is('.song') && !DB.mp3 && Player.hasReal) { View.addplaylist(target.parent()); e.preventDefault(); } });
    $('#favourites').click(function(e) { var target = $(e.target); if (target.is('.remove'))  { View.removestar(target.parent()); e.preventDefault(); } });
    $('#Star'      ).click(function(e) { var target = ev(e); View.addstar(target.attr('song')); });
    $('#Info'      ).click(function(e) { var target = ev(e); View.showInfo(target.attr('song')); });
    $('.control'   ).click(function(e) { var target = ev(e); if (Player.hasReal) { View.playpause(); } });
    $('.showtab'   ).click(function(e) { var target = ev(e); $('#' + target.attr('id').replace('show_', '')).showTab(); });
    $('#changeuser').click(function(e) { var target = ev(e); $('#loggedinmsg').hide(); $('#changeloginmsg').show(); $('#getuser').focus().select(); });
    $('#canceluser').click(function(e) { var target = ev(e); $('#loggedinmsg').show(); $('#changeloginmsg').hide(); });
    $('#getrecent' ).click(function(e) { var target = ev(e); View.refreshrecent(); });

    $('#comment-form').submit(function(e) {
        e.preventDefault();
        var data = {}, that = $(this);
        $('#comment-form input[type!=submit],textarea').each(function() { data[$(this).attr('name')] = $(this).val(); });
        $.ajax({
            url: that.attr('action'),
            data: data,
            type: 'POST',
            success: function() { that.hide(500); $('#feedback-msg').html('Thank you for your feedback').show(); },
            error: function() { $('#feedback-msg').html('Feedback not submitted. Ensure that the e-mail ID is valid, and you have typed in your name and a comment').show(); }
        });
    });
    $('#tabContent,#playlist').bind('contextmenu', function(e) { if (!DB.mp3) {
        var target = $(e.target);
        if (target.parent().is('.play')) { View.showMenu(target); e.preventDefault(); }
    } });
    $().keypress(function(e) {
        if (Player.hasReal && !$(e.target).is('input,textarea') && !e.ctrlKey && !e.altKey && !e.metaKey) {
            var code = e.charCode || e.keyCode;
            if (code ==  80 || code == 112) { View.playpause(); e.preventDefault(); }
            if (code ==  43 || code ==  61) { Player.vol(0.20);   e.preventDefault(); }
            if (code ==  45 || code ==  95) { Player.vol(-0.20);  e.preventDefault(); }
            if (code ==  46 || code ==  62) { Player.seek(10);  e.preventDefault(); }
            if (code ==  44 || code ==  60) { Player.seek(-10); e.preventDefault(); }
            if (code ==  27)                { View.hideMenu(); }
        }
    });
    $('#getuser').keypress(function(e) {
        if (e.which == 13) {
            var user = $(this).val();
            $('#user').html(user);
            $('#changeloginmsg').hide();
            $('#loggedinmsg').show();
            Star.user(user);
        }
    });

    $.each('A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [^A-Z]'.split(' '), function(i, v) { $('#movie-catalog').append('<a href="#" class="movie catalog">' + v + '</a> '); });
    $.each('A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' '), function(i, v) { $('#music-catalog').append('<a href="#" class="music catalog">' + v + '</a> '); });
    $.each('193. 194. 195. 196. 197. 198. 199. 200.'.split(' '), function(i, v) { $('#year-catalog').append('<a href="#" class="year catalog">' + v + '</a> '); });

    window.Player = new RMPlayer('#rmplayer_ff,#rmplayer_ie', function() { View.playnext(); });
}

function MPlayer(lang) {
    var pop = {
        'hindi' : 'hindi_bollywood',
        'carnatic' : 'carnatic_vocal'
    };
    window.DB = new SongDb(lang);
    window.Star = new StarDb($.cookie.mail);
    $('#user').html($.cookie.mail || 'not logged in');
    $.get('/songs/' + DB.lang + '.jsz', function(s) {
        DB.loadsong(s);
        $('#loading').hide();
        $('#search_label').show();
        $('#search').show().focus();
        // Note: Do NOT do a setInterval to check document.location.hash periodically. That's not how it's supposed to be used.
        if (document.location.hash) { View.hashsearch(); }
    });
    // TODO: Implement 'popular' for carnatic
    if (!DB.mp3) {
        $.get('/songs/' + DB.lang + '.movie.jsz', function(s) { DB.loadmovie(s); });
        if (DB.lang != 'carnatic') {
            $.getJSON('/db/song/popular.' + lang, function(data) {
                $.each(data, function(i, v) {
                    var movie = v.movie.s(/\s*\(\d\d*\)\s*/, ''), ms = movie + '~' + v.song;
                    Player.cache[ms] = { movie: movie, song: v.song, html: [v.link], real: [], lyrics: [] };
                    $('#popular .songs').append(View.song(ms));
                });
                if (!document.location.hash) { $('#popular').showTab(); }
            });
        }
    } else {
        $('#results').showTab();
    }
    View.refreshrecent();
}

onErr(function(obj, fn, err, args) {
    if (typeof err == 'string') { fn += '%09' + err; }
    else if (typeof err == 'object') { for (var i in err) { if (1) { fn += '%09' + i + '=' + err[i]; } } }
    $.get('/e/log.pl?f=newmplayer&m=$browser~' + fn.substr(0,500));
}, SongDb, RMPlayer, View, StarDb, init, MPlayer);

init();
