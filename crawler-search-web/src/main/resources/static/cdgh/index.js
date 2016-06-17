Handlebars.registerHelper('formatDate', function(date) {
    return  moment(date).format('YYYY-MM-DD hh:mm:ss');
});

$(function () {
    //提交表单
    $('form.searchForm').submit(function (event) {
        $('#waitModal').modal('show');
        event.preventDefault();
        $.get('/cdgh/search?keyword=' + $('input.keyword').val(), function (data) {
            $('#waitModal').modal('hide');
            if (data.content) {
                var template = Handlebars.compile($('#template').html());
                $('div.list-group').html(template(data));
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

    var stompClient = null;

    function connect() {
        var socket = new SockJS('/ws');
        disconnect();
        stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            var jobId = Date.now();

            stompClient.subscribe('/topic/progress/cdgh/' + jobId, function (msg) {
                console.log('Msg Received: ' + msg);
                var body = JSON.parse(msg.body);
                $('#progressModal .progress-bar').width(body.progress + '%');
                if (body.progress >= 100) {
                    $('#progressModal').modal('hide');
                }
            });
            stompClient.send("/app/cdgh/craw/start", {}, jobId);
        });
    }

    function disconnect() {
        if (stompClient != null) {
            stompClient.disconnect();
        }
        console.log("Disconnected");
    }

});
