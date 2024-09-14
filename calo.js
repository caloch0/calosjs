(function (w) {
    function renderScope(data, scope, prefix, xPath) {
        if (xPath) xPath = xPath + "."

        for (const name in data) {
            if (Object.hasOwnProperty.call(data, name)) {
                const fieldValue = data[name];
                var selector = prefix + name
                var fullPath = xPath + name
                if (isValType(fieldValue)) {
                    const els = getElsByFieldName(scope, selector)
                    els.forEach(el => {
                        SetValue(el, fieldValue)
                        el.dataset.xpath = fullPath
                    });
                } else if (isObjectType(fieldValue)) {
                    const els = getElsByFieldName(scope, selector)
                    els.forEach(el => {
                        el.dataset.xpath = fullPath
                        renderScope(fieldValue, el, "", fullPath)
                    })
                } else if (isArrayType(fieldValue)) {
                    const els = scope.querySelectorAll("[\\@field^=" + selector + "\\|]")
                    els.forEach(el => {
                        const subAlias = el.getAttribute("@field").split('|')[1]
                        let ci = 0
                        let lastCursor = el
                        fieldValue.forEach(val => {
                            clone = el.cloneNode(true)
                            clone.style.display = ''
                            clone.setAttribute("poped", "true")
                            fullPath = xPath + name + `[${ci}]`
                            clone.dataset.xpath = fullPath
                            clone.dataset.index = ci
                            insertAfter(clone, lastCursor)
                            lastCursor = clone
                            if (isValType(val))
                                SetValue(clone, val)
                            else
                                renderScope(val, clone, subAlias + ".", fullPath)
                            ci++
                            el.style.display = 'none'

                        });
                    })
                }
            }
        }

        const els = scope.querySelectorAll("[\\@field]")
        els.forEach(el => {
            const dataPath = el.getAttribute("@field")
            if (dataPath.indexOf('.') !== -1) {
                try {
                    var v = eval("data" + "." + dataPath)
                    if (isValType(v)) {
                        el.dataset.xpath = dataPath
                        SetValue(el, v)
                    }
                } catch { }
            }

        })
    }

    function init($this, el, setting) {
        $this.default = {
            global: {},
            model: {}
        }
        $this.settings = setting || $this.default
        $this.rootel = el
        $this.refs = {}
        let refs = el.querySelectorAll('[ref]')
        refs.forEach(r => {
            let refName = r.getAttribute('ref')
            $this.refs[refName] = r
        })
        $this.homeTemplate = encodeURIComponent(el.innerHTML)
        $this.homeSettings = $this.settings

    }
    var calo = function (el, setting) {
        init(this, el, setting)
        calo.run.apply(this)
    }
    calo.prototype = {
        getElsByxpath: function (xpath) {
            return this.rootel.querySelectorAll(`[data-xpath= '${xpath}']`)
        },
        makePlugin: function (functionPlugin) {
            if (typeof functionPlugin === "function") {
                var tg = functionPlugin.name
                var els = this.rootel.getElementsByTagName(tg)
                for (let el of els) {
                    var props = {}
                    let atns = el.getAttributeNames()
                    for (let i = 0; i < atns.length; i++) {
                        props[atns[i]] = el.getAttribute(atns[i])
                    }
                    let ret = functionPlugin.call(this, props)
                    el.outerHTML = ret
                }
            }
            calo.run.apply(this)
        },
        callPlugin: function (el, functionPlugin) {
            let args = [el]
            for (let i = 2; i < arguments.length; i++) {
                args.push(arguments[i])
            }
            functionPlugin.apply(this, args)
            calo.run.apply(this)
        },
        reload: function () {
            this.rootel.innerHTML = decodeURIComponent(this.homeTemplate)
            init(this, this.rootel, this.homeSettings)
            calo.run.apply(this)
        },
        navi(url, app) {
            this.settings.model = null
            app.navigate(url)
        }
    }

    function removePoppedbyScope(scopeEl) {
        var poped = scopeEl.querySelectorAll("[poped='true']")
        poped.forEach(p => {
            p.remove()
        })
    }

    calo.run = function () {
        if (this.settings.model === null) return
        this.current = this
        var target = this
        var root = target.rootel
        removePoppedbyScope(root)
        renderScope({
            ...target.settings.global,
            ...target.settings.model
        }, root, "", "")
        var clicks = root.querySelectorAll("[\\@Click]")
        var changes = root.querySelectorAll("[\\@Change]")
        clicks.forEach(c => {
            c.onclick = function (e) {
                target.settings[c.getAttribute("@Click")].call(target, c, c.value)
                calo.run.apply(target)
            }
        })
        changes.forEach(c => {
            c.onchange = function () {
                target.settings[c.getAttribute("@Change")].call(target, c, c.value)
                calo.run.apply(target)
            }

            // const parent = c.parentNode;
            // const newElement = c.cloneNode(true); 
            // parent.replaceChild(newElement, c);
            // if (c.tagName === 'SELECT') {
            //     newElement.value = c.value
            // }

            // var handler = function (e) {
            //     e.preventDefault()
            //     e.stopPropagation()
            //     target.settings[c.getAttribute("@Change")].call(target, newElement, newElement.value)
            //     calo.run.apply(target)
            // }
            // newElement.addEventListener('change', handler)


        })

        root.querySelectorAll("[\\@Show]").forEach(el => {
            const field = el.getAttribute("@Show")
            const flag = calo.model[field]
            el.style.display = flag === true ? '' : 'none'
        })

        var links = root.querySelectorAll("[\\@Link]")

        links.forEach(l => {
            l.onclick = function (e) {
                e.preventDefault();
                if (target.navigate) {
                    var dest = l.getAttribute("@Link")
                    target.navigate(dest)
                }
            }
        })

        applySameFieldKeyupChange("input[type=text]")
        applySameFieldKeyupChange("textarea")
        applySameFieldKeyupChange("input[type=date]")
        applySameFieldKeyupChange("input[type=password]")
        applySameFieldKeyupChange("input[type=number]")

        applySameFieldClickChange("input[type=checkbox]")
        applySameFieldClickChange("input[type=radio]", function (el) {
            if (el.name) {
                const groupname = el.name
                const group = root.querySelectorAll(`input[type=radio][name=${groupname}]`)
                for (let i = 0; i < group.length; i++) {
                    if (i == 0) continue;
                    const el1 = group[i];
                    if (!el1.isEqualNode(el)) {
                        eval("target.settings.model." + el1.dataset.xpath + "=false")
                    }

                }
            }

        })
        applySameFieldSelectChange()

        function applySameFieldKeyupChange(tag) {
            root.querySelectorAll(tag).forEach(ip => {
                if (window.addEventListener) {
                    ip.addEventListener('keyup', function (e) {
                        e.preventDefault()
                        e.stopPropagation()
                        eval("target.settings.model." + ip.dataset.xpath + "='" + ip.value + "'")
                        if (target.settings.global.hasOwnProperty(ip.dataset.xpath)) {
                            eval("target.settings.global." + ip.dataset.xpath + "='" + ip.value + "'")
                        }
                        root.querySelectorAll(`[data-xpath= '${ip.dataset.xpath}']`).forEach(el => {
                            SetValue(el, ip.value)
                        })

                    }, false);
                } else {
                    ip.attachEvent('change', function () {
                        console.log(5);
                    });
                }
            })
        }

        function applySameFieldClickChange(tag, pre) {
            root.querySelectorAll(tag).forEach(ipc => {
                ipc.onclick = function () {
                    if (pre) pre(this)
                    var val = this.checked
                    var xpath = this.dataset.xpath
                    eval("target.settings.model." + xpath + "='" + val + "'")
                    const nodes = root.querySelectorAll(`[data-xpath= '${xpath}']`);
                    nodes.forEach(el => {
                        SetValue(el, val)
                    })

                }
            })
        }

        function applySameFieldSelectChange() {
            root.querySelectorAll("Select").forEach(ipc => {
                ipc.addEventListener('change', function (e) {
                    e.preventDefault()
                    e.stopPropagation()
                    const selected = this.value
                    var xpath = ipc.dataset.xpath
                    eval("target.settings.model." + xpath + "='" + selected + "'")
                    const nodes = root.querySelectorAll(`[data-xpath= '${xpath}']`);
                    nodes.forEach(el => {
                        SetValue(el, selected)
                    })
                })

            })
        }

    }

    function SetValue(el, val) {
        if (el.tagName === "INPUT" && el.type === "text") el.value = val
        else if (el.tagName === "INPUT" && el.type === "password") el.value = val
        else if (el.tagName === "INPUT" && el.type === "date") el.value = val
        else if (el.tagName === "INPUT" && el.type === "number") el.value = val
        else if (el.tagName === "TEXTAREA") el.value = val
        else if (el.tagName === "A") el.href = val
        else if (el.tagName === "IMG") el.src = val
        else if (el.tagName === "INPUT" && el.type === "checkbox")
            el.checked = val
        else if (el.tagName === "INPUT" && el.type === "radio") el.checked = val
        else if (el.tagName === "BUTTON") {
            const dataName = el.getAttribute("@field")
            el.dataset[dataName] = val
        } else if (["LABEL", "SPAN", "OPTION", "H2", "H1", "H3", "P", "DIV", "LI"].indexOf(el.tagName) !== -1) {
            el.innerHTML = val
        } else if (el.tagName === 'SELECT') {
            el.value = val
        }

    }

    function getElsByFieldName(scope, fieldName) {
        return scope.querySelectorAll("[\\@field='" + fieldName + "'")
    }

    function isValType(obj) {
        return typeof obj === "number" || typeof obj === "string" || typeof obj === "boolean"
    }

    function isArrayType(obj) {
        return obj instanceof Array
    }

    function isObjectType(obj) {
        return !(obj instanceof Array) && typeof obj === "object"
    }

    function insertAfter(newElement, targetElement) {
        var parent = targetElement.parentNode;
        if (parent.lastChild == targetElement) {
            parent.appendChild(newElement);
        } else {
            parent.insertBefore(newElement, targetElement.nextSibling);
        }
    }

    w.calo = calo
})(window);