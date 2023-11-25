(function (w) {

    function loadScript(path) {
        var node = document.createElement('script')
        node.type = 'text/javascript'
        node.src = path + '?_=' + (new Date().getTime())
        document.body.appendChild(node)
    }

    function loadScripts() {
        for (let i = 0; i < arguments.length; i++) {
            const el = arguments[i];
            loadScript(el)
        }
    }

    function redirect(path) {
        location.href = path
    }

    function getHtmlOrJson(url, success) {
        function makeHttpObject() {
            if ("XMLHttpRequest" in window) return new XMLHttpRequest();
            else if ("ActiveXObject" in window) return new ActiveXObject("Msxml2.XMLHTTP");
        }

        var request = makeHttpObject();
        request.open("GET", url + "?" + new Date().getTime(), true);
        request.send(null);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                success(request.responseText)
            }
        };
    }


    function getQueryJson(route) {
        let arr = route.split("?")[1].split("&");
        let queryJson = {};
        for (let i of arr) {
            queryJson[i.split("=")[0]] = i.split("=")[1];
        }
        return queryJson
    }

    function whenready(onload) {
        document.body.onload = onload
    }

    //intended as a loaded scripts manager to avoid additional load of same file
    window.loadedScripts = [];


    function require(file, callback) {
        if (window.loadedScripts.indexOf(file) === -1) {
            // create script element
            var script = document.createElement("script");
            script.src = file;
            // monitor script loading
            // IE < 7, does not support onload
            if (callback) {
                script.onreadystatechange = function () {
                    if (script.readyState === "loaded" || script.readyState === "complete") {
                        // no need to be notified again
                        script.onreadystatechange = null;
                        window.loadedScripts.push(file)
                        // notify user
                        callback();
                    }
                };
                // other browsers
                script.onload = function () {
                    callback();
                };
            }
            // append and execute script
            document.documentElement.firstChild.appendChild(script);
        }
    }



    function requireAll(scripts) {
        let promises = [];
        scripts.filter(s => window.loadedScripts.indexOf(s) === -1).forEach(function (url) {
            var loader = new Promise(function (resolve, reject) {
                let script = document.createElement('script');
                script.src = url;
                script.async = false;
                script.onload = function () {
                    window.loadedScripts.push(url)
                    resolve(url);
                };
                script.onerror = function () {
                    reject(url);
                };
                document.body.appendChild(script);
            });
            promises.push(loader);
        });

        return Promise.all(promises)
            .then(function () {
                console.log('all scripts loaded');
            }).catch(function (script) {
                console.log(script + ' failed to load');
            });
    }


    const utils = {
        loadScript,
        loadScripts,
        redirect,
        getQueryJson,
        getHtmlOrJson,
        whenready,
        require,
        requireAll,
    }
    for (const i in utils) {
        w[i] = utils[i]
    }

})(window);