$(function () {
    //提交表单
    $('form.searchForm').submit(function (event) {
        $('#waitModal').modal('show');
        event.preventDefault();
        $.get('/search?keyword=' + $('input.keyword').val(), function (data) {
            $('#waitModal').modal('hide');
            if (data.content) {
                var template = $('#template').html();
                Mustache.parse(template);
                var rendered = Mustache.render(template, data);
                $('div.list-group').html(rendered);
            }
        }).fail(function (e) {
            $('#waitModal').modal('hide');
            alert(e.responseJSON.message);
        });
    });

    //增量更新全部邮件
    $('button.update-all').click(function (e) {
        e.preventDefault();
        connect();
        $('#progressModal .progress-bar').width('0%');
        $('#progressModal').modal('show');

    });

    //更新当前邮件
    $(document).on('click', '.updateBtn', function (e) {
        $('#waitModal').modal('show');
        e.preventDefault();
        var $target = $(this);
        var id = $target.data('id'),
            url = $target.data('url');
        $.post('/update', {'id': id, 'url': url}, function (data) {
            $('#waitModal').modal('hide');
            $target.siblings('.result').text(data.result);
        });
    });

    var stompClient = null;

    function connect() {
        var socket = new SockJS('/ws');
        disconnect();
        stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            var jobId = Date.now();

            stompClient.subscribe('/topic/progress/' + jobId, function (msg) {
                console.log('Msg Received: ' + msg);
                var body = JSON.parse(msg.body);
                $('#progressModal .progress-bar').width(body.progress + '%');
                if (body.progress >= 100) {
                    $('#progressModal').modal('hide');
                }
            });
            stompClient.send("/app/craw/start", {}, jobId);
        });
    }

    function disconnect() {
        if (stompClient != null) {
            stompClient.disconnect();
        }
        console.log("Disconnected");
    }

});
