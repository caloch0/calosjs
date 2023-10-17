(function (w) {
    function renderScope(data, scope, prefix, xPath) {
        if (xPath) xPath = xPath + "."

        const els = scope.querySelectorAll("[\\@field]")
        els.forEach(el => {
            if (el.dataset.xpath && data[el.dataset.xpath] && isValType(data[el.dataset.xpath])) {
                SetValue(el, data[el.dataset.xpath])
            } else {
                const dataPath = el.getAttribute("@field")
                if (dataPath) {
                    el.dataset.xpath = dataPath
                    var v = eval("data" + "." + dataPath)
                    if (isValType(v))
                        SetValue(el, v)
                }
            }
        })

        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const fieldValue = data[key];
                if (isValType(fieldValue)) {
                    const els = getElsByFieldName(scope, prefix + key)
                    els.forEach(el => {
                        SetValue(el, data[key])
                        el.dataset.xpath = xPath + key
                    });
                } else if (isObjectType(fieldValue)) {
                    const els = getElsByFieldName(scope, key)
                    els.forEach(el => {
                        el.dataset.xpath = xPath + key
                        renderScope(fieldValue, el, "", el.dataset.xpath)
                    })
                } else if (isArrayType(fieldValue)) {
                    const els = scope.querySelectorAll("[\\@field^=" + key + "\\|]")
                    els.forEach(el => {
                        const subAlias = el.getAttribute("@field").split('|')[1]
                        let ci = 0
                        let lastCursor = el
                        fieldValue.forEach(val => {
                            clone = el.cloneNode(true)
                            clone.style.display = ''
                            clone.setAttribute("poped", "true")
                            clone.dataset.xpath = xPath + key + `[${ci}]`
                            clone.dataset.index = ci
                            insertAfter(clone, lastCursor)
                            lastCursor = clone
                            if (isValType(val))
                                SetValue(clone, val)
                            else
                                renderScope(val, clone, subAlias + ".", clone.dataset.xpath)
                            ci++
                            el.style.display = 'none'

                        });
                    })
                }
            }
        }
    }

    var calo = function (el, setting) {
        this.default = {
            global: {},
            model: {}
        }
        this.settings = setting || this.default
        this.rootel = el
        this.refs = {}
        let refs = el.querySelectorAll('[ref]')
        refs.forEach(r => {
            let refName = r.getAttribute('ref')
            this.refs[refName] = r
        })
        calo.run.apply(this)
    }
    calo.prototype = {
        getElsByxpath: function (xpath) {
            return this.rootel.querySelectorAll(`[data-xpath= '${xpath}']`)
        }
        , makePlugin: function (idOrEl, functionPlugin) {
            if (idOrEl instanceof HTMLElement)
                functionPlugin.call(this, idOrEl)
            else
                functionPlugin.call(this.settings, document.getElementById(idOrEl))
            calo.run.apply(this)
        }
        , callPlugin: function (el, functionPlugin) {
            let args = [el]
            for (let i = 2; i < arguments.length; i++) {
                args.push(arguments[i])
            }
            functionPlugin.apply(this, args)
            calo.run.apply(this)
        }
    }

    function removePoppedbyScope(scopeEl) {
        var poped = scopeEl.querySelectorAll("[poped='true']")
        poped.forEach(p => {
            p.remove()
        })
    }

    calo.run = function () {
        const target = this
        const root = target.rootel
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
        })

        root.querySelectorAll("[\\@Show]").forEach(el => {
            const field = el.getAttribute("@Show")
            const flag = calo.model[field]
            el.style.display = flag === true ? '' : 'none'
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
                group.forEach(el1 => {
                    if (!el1.isEqualNode(el)) {
                        const sen = el1.dataset.xpath + "=false"
                        eval(sen);
                    }
                })
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
                    eval(xpath + "=" + val + "")
                    const nodes = root.querySelectorAll(`[data-xpath= '${xpath}']`);
                    nodes.forEach(el => {
                        SetValue(el, val)
                    })

                }
            })
        }

        function applySameFieldSelectChange() {
            root.querySelectorAll("Select").forEach(ipc => {
                ipc.onchange = function () {
                    const selected = this.value
                    var xpath = this.dataset.xpath
                    eval(xpath + "='" + selected + "'")
                    const nodes = root.querySelectorAll(`[data-xpath= '${xpath}']`);
                    nodes.forEach(el => {
                        SetValue(el, selected)
                    })

                }
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
        else if (el.tagName === "INPUT" && el.type === "checkbox")
            el.checked = val
        else if (el.tagName === "INPUT" && el.type === "radio") el.checked = val
        else if (el.tagName === "BUTTON") {
            const dataName = el.getAttribute("@field")
            el.dataset[dataName] = val
        } else if (["LABEL", "SPAN", "OPTION", "H2", "H1", "H3", "P", "DIV", "LI"].indexOf(el.tagName) !== -1) {
            console.log(el.tagName);
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

