function ajaxExtend(o) {
    o.ajax = ajax
    o.ajaxJson = ajaxJson
    o.ajaxQueue = ajaxQueue

    function ajaxQueue(req) {
        if (!ajaxQueue.queue)
            ajaxQueue.queue = []
        if (req)
            ajaxQueue.queue.push(req)
        if (ajaxQueue.locked) return //if the queue is locked, only push new request to the queue, return ahead of time
        if (ajaxQueue.queue.length > 0) {
            if (!ajaxQueue.locked) {
                const {
                    url,
                    data,
                    type,
                    success,
                    error
                } = ajaxQueue.queue[0]
                ajaxQueue.locked = true
                ajax({
                    url: url,
                    data: data,
                    type: type,
                    success: function (resp) {
                        success(resp)
                        ajaxQueue.queue.shift()
                        ajaxQueue.locked = false
                        ajaxQueue()

                    },
                    error: function () {
                        error()
                        ajaxQueue.locked = false
                        ajaxQueue()
                    }
                })
            }
        }
    }


    function ajaxJson({
        url,
        data,
        type,
        success,
        error
    }, beforeSend) {
        type = type || "get";
        data = data || {};
        let str = "";
        for (let i in data) {
            str += `${i}=${data[i]}& `;
        }
        str = str.slice(0, str.length - 1);
        if (type === "get") {
            var d = new Date();
            url = url + "?" + str + "&__qft=" + d.getTime();
        }
        let xhr = new XMLHttpRequest();
        xhr.open(type, url, true);
        if (beforeSend) beforeSend(xhr);
        if (type === "get") {
            xhr.send();
        } else if (type === "post") {
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify(data));
        }
        xhr.onload = function () {
            if (xhr.status === 200) {
                success.call(o.current, JSON.parse(xhr.responseText))
                calo.run.apply(o.current);
            } else {
                error && error(xhr.status);
            }
        }
    }

    function ajax({
        url,
        data,
        type,
        success,
        error
    }, beforeSend) {
        type = type || "get";
        data = data || {};
        let str = "";
        for (let i in data) {
            str += `${i}=${data[i]}& `;
        }
        str = str.slice(0, str.length - 1);
        if (type === "get") {
            var d = new Date();
            url = url + "?" + str + "&__qft=" + d.getTime();
        }
        let xhr = new XMLHttpRequest();
        xhr.open(type, url, true);
        if (beforeSend) beforeSend(xhr);
        if (type === "get") {
            xhr.send();
        } else if (type === "post") {
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.send(str);
        }
        xhr.onload = function () {
            if (xhr.status === 200) {
                success.call(o.current, JSON.parse(xhr.responseText))
                calo.run.apply(o.current);
            } else {
                error && error(xhr.status);
            }
        }
    }
    return o

}
