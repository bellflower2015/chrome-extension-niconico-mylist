var pollWrapper;
var type; // 'mypage', 'public'

var mylistitem = [];

var comma = function(num) {
    return num.replace(/(\d)(?=(\d\d\d)+$)/g, '$1,');
};

var two = function(num) {
    if (num < 10) num = '0' + parseInt(num);
    return num;
};

var ymdhi = function(sec) {
    var d = new Date(sec * 1000);
    return d.getFullYear()
         + '年'
         + two(d.getMonth()+1)
         + '月'
         + two(d.getDate())
         + '日 '
         + two(d.getHours())
         + ':'
         + two(d.getMinutes());
};

var select2FormatResult = function(state) {
    if (!state.id) {
        return state.text;
    } else {
        var prop = mylistitem[state.id];

        var time = prop.length_seconds;
        var s = two(time % 60);
        var m = parseInt(time / 60);
        var timeStr = m + ':' + s;

        var view_counter = comma(prop.view_counter);
        var num_res = comma(prop.num_res);
        var mylist_counter = comma(prop.mylist_counter);

        var first_retrieve = ymdhi(prop.first_retrieve);
        var create_time = ymdhi(prop.create_time);

        return '<div class="my-search-list-box"><div class="thumbContainer"><img src="' + prop.thumbnail_url + '" /><span class="videoTime">' + timeStr + '</span></div><div class="myListVideo"><h5>' + state.text + '</h5><ul class="metadata"><li class="play">再生:' + view_counter + '</li><li class="comment">コメント:' + num_res + '</li><li class="mylist">マイリスト:' + mylist_counter + '</li></ul><p class="date">' + first_retrieve + ' 投稿／' + create_time + ' 登録</p></div></div>';
    }
};

var display = function(href, hash) {
    if (!href.match(/www.nicovideo.jp\/my\/mylist/)) {
        if (hash.match(/mymemory/)) {
            $('div#mySearch').hide();
        } else {
            $('div#mySearch').show();
        }
    } else if (!href.match(/www.nicovideo.jp\/mylist/)) {
        $('div#mySearch').show();
    } else {
        $('div#mySearch').hide();
    }
};

var prepareData = function(data) {
    mylistitem = [];
    $('select#mySearchSelect option').remove();
    $('select#mySearchSelect').append($('<option>'));
    if (data && data.mylistitem) {
        data.mylistitem.sort(function(a,b) {
            if (a.create_time > b.create_time) return -1;
            if (a.create_time < b.create_time) return 1;
            return 0;
        });
        $.each(data.mylistitem, function(i, elem) {
            if (elem.item_data.video_id) {
                $('select#mySearchSelect').append($('<option>').text(elem.item_data.title).attr('value', elem.item_data.video_id));
                mylistitem[elem.item_data.video_id] = {
                    watch_id:       elem.item_data.watch_id,
                    title:          elem.item_data.title,
                    thumbnail_url:  elem.item_data.thumbnail_url,
                    length_seconds: elem.item_data.length_seconds,
                    view_counter:   elem.item_data.view_counter,
                    num_res:        elem.item_data.num_res,
                    mylist_counter: elem.item_data.mylist_counter,
                    first_retrieve: elem.item_data.first_retrieve,
                    create_time:    elem.create_time
                };
            }
        });
    }
};

var getMyList = function(href, hash) {
    if (type == 'mypage') {
        var url = 'http://www.nicovideo.jp/api/deflist/list';

        if (hash.match(/\d+/)) {
            var num = hash.match(/\d+/);
            url = 'http://www.nicovideo.jp/api/mylist/list?group_id=' + num;
        }

        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function(data) {
                prepareData(data);
            }
        });
        display(href, hash);
    } else if (type == 'public') {
        if ($('.SYS_box_filter strong') && $('.SYS_box_filter strong').text().length > 0) {
            var script = $('script').text();
            if (script && script.length > 0) {
                var match;
                if (match = script.match(/Mylist\.preload\(\d+, (.*)\);/)) {
                    if (match && match[1] && match[1].length > 0) {
                        var data = {mylistitem: []};
                        eval('data.mylistitem = ' + match[1]);
                        prepareData(data);
                    }
                }
            }
        }
        display(href, hash);
    }
};

var createSelectTag = function() {
    if (type == 'mypage') {
        $('div.wrapper').before('<div class="my-search" id="mySearch"><h3>マイリスト検索</h3><div class="my-search-box"><select id="mySearchSelect"></select></div></div>');
    } else if (type == 'public') {
        $('ul.tabMenu').before('<div class="my-search" id="mySearch" style="width: 98%;"><h3>マイリスト検索</h3><div class="my-search-box" style="width: 630.55px;"><select id="mySearchSelect"></select></div></div>');
    } else {
        return;
    }

    getMyList(window.location.href, window.location.hash);

    $('a').on('click', function(e) {
        getMyList(e.currentTarget.href, e.currentTarget.hash);
    });

    var $select = $('select#mySearchSelect').select2({
        allowClear: true,
        width: "100%",
        placeholder: "マイリスト検索",
        templateResult: select2FormatResult,
        escapeMarkup: function(m) { return m; }
    });

    $select.on('select2:unselecting', function(e) {
        e.preventDefault();
        $select.val('').change();
    });

    $select.on("select2:select", function (e) {
        if (e && e.params && e.params.data && e.params.data.id) {
            var watch_id = mylistitem[e.params.data.id].watch_id;
            if (watch_id && watch_id.length > 0) {
                window.open(
                    'http://www.nicovideo.jp/watch/' + watch_id,
                    '_blank'
                );
            }
        }
    });

    display(window.location.href, window.location.hash);
};

var waitWrapper = function() {
    if ($('div.wrapper') && $('div.wrapper')[0] && pollWrapper) {
        clearInterval(pollWrapper);
        type = 'mypage';
        createSelectTag();
    } else if ($('div#SYS_page_items') && $('div#SYS_page_items')[0] && pollWrapper) {
        clearInterval(pollWrapper);
        type = 'public';
        createSelectTag();
    }
};


$(function() {
    if (document.getElementById("mylist") != null) {
        pollWrapper = setInterval(waitWrapper, 100);
    } else if (document.getElementById("SYS_box_mylist_body") != null) {
        pollWrapper = setInterval(waitWrapper, 100);
    }
});
