function routerExtend(o, routes) {
    o.spaPath = o.spaPath || "./"
    o.templateStorage = o.templateStorage || {}
    const root = o.rootel;

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

        if (!o.templateStorage[route.toLowerCase()] && route !== '/') {
            var pagePath = o.spaPath + route.substr(1) + ".html"
            getHtmlOrJson(pagePath + "?_=" + Math.random(), function (text) {
                o.templateStorage[route.toLowerCase()] = encodeURIComponent(text);
                makePage(route, o)
            })
        }
        else
            return makePage(route, o)
    }

    router(routes)


    function makePage(route, o) {
        var navPage
        var routerel = o.rootel.querySelector("[\\@Router]")
        var hm = stringToHTML(decodeURIComponent(o.templateStorage[route.toLowerCase()]))
        var scriptBlock = hm.getElementsByTagName('script')[0]
        var script = scriptBlock ? scriptBlock.text : ''
        if(!scriptBlock){
            console.log('404 not found,back to home',route)
            o.reload(o.query,o)
            return
        }
        if (!routerel) root.innerHTML = hm.innerHTML
        else routerel.innerHTML = hm.innerHTML
        if (script) {
            var page
            if (route !== "/") {
                eval(script)
                if (!Page) { { console.log('Page should have function Page') }; return; }
                page = new Page(o.query, o)
            }

            page.settings.global = { ...o.settings?.global, ...page.settings?.global }

            navPage = new calo(o.rootel, page.settings)
            navPage.parent = o
            o.current = navPage
            o.currentReqs = []
            o.settings = navPage.settings
        }

        if (route === "/") {
            o.reload(o.query,o)
            return
        }
        if(page.onload){
            page.onload(o.query,o)
        }

        return navPage
    }
    function stringToHTML(str) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(str, 'text/html');
        return doc.body;
    };

    function router(routes) {
        o.homeSettings = o.settings
        var router = o.settings.routes || {}
        router = {
            ...router,
            ...routes
        }
        var proms = []
        for (const key in router) {
            if (Object.hasOwnProperty.call(router, key)) {
                const keyLower = key.toLowerCase()
                var p = new Promise(resolve => {
                    const htmlName = router[key];
                    getHtmlOrJson(o.spaPath + htmlName + "?_=" + Math.random(), function (text) {
                        o.templateStorage[keyLower] = encodeURIComponent(text);
                        resolve()
                    })

                })
                proms.push(p)
            }
        }
        Promise.all(proms).then(function () {
            window.templateLoaded = true
            console.log('all templates have been loaded')
            if (location.href.indexOf('#') !== -1) {
                var path = location.href.split('#')[1]
                o.navigate(path)
            }
        })
    }
    return o;

}

