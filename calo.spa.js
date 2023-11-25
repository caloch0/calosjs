function routerExtend(o, routes) {
    o.spaPath = o.spaPath || "./"
    const root = o.rootel.querySelector("[\\@Router]") || o.rootel;
    router(routes)

    o.navigate = function (route, isHistory) {
        if (!window.templateLoaded && route !== "/") {
            console.log("only route template is loaded, rquesting others cannot succeed")
            return
        }
        if (isHistory) {
            window.history.pushState({
                route
            }, '', route)
        } else {
            location.href = location.href.split('#')[0] + '#' + route
        }
        if (route.indexOf('?') !== -1) {
            o.query = getQueryJson(route)
            const parts = route.split('?')
            route = parts[0]
        } else {
            o.query = {}
        }
        root.innerHTML = ''
        var hm = stringToHTML(decodeURIComponent(o.templateStorage[route.toLowerCase()]))
        var scriptBlock = hm.getElementsByTagName('script')[0]
        var script = scriptBlock ? scriptBlock.text : ''
        root.appendChild(hm)
        if (script) {
            eval(script)
            if (!Page) { { console.log('Page should have function Page') }; return; }
            var page = new Page(o.query)
            new calo(o.rootel,page.settings)
        }
        var links = root.querySelectorAll("[\\@Link]")

        links.forEach(l => {
            l.onclick = function (e) {
                e.preventDefault();
                if (o.navigate) {
                    var dest = l.getAttribute("@Link")
                    o.navigate(dest)
                }
            }
        })

    }

    function stringToHTML(str) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(str, 'text/html');
        return doc.body;
    };


    function router(routes) {
        var router = o.routes || {}
        router = {
            ...router,
            ...routes
        }
        const templateStorage = o.templateStorage || {}
        var proms = []
        for (const key in router) {
            if (Object.hasOwnProperty.call(router, key)) {
                const keyLower = key.toLowerCase()
                var p = new Promise(resolve => {
                    const htmlName = router[key];
                    getHtmlOrJson(o.spaPath + htmlName + "?_=" + Math.random(), function (text) {
                        templateStorage[keyLower] = encodeURIComponent(text);
                        resolve()
                    })

                })
                proms.push(p)
            }
        }
        Promise.all(proms).then(function () {
            window.templateLoaded = true
            console.log('all templates have been loaded')
        })
    }
    return o;

}

