
function pluginTree(container) {
    const calo = this
    var root = {
        id: 0,
        pid: null,
        name: 'CMS'
    }
    var nodes = [root, {
        id: 1,
        pid: 0,
        name: 'pages'
    }]
    nodes.push({
        id: 2,
        pid: 1,
        name: 'contentsManager',
        url: '/contentsManager'
    })
    nodes.push({
        id: 3,
        pid: 1,
        name: 'contentsave',
        url: '/contentsave'
    })
    nodes.push({
        id: 4,
        pid: 1,
        name: 'register',
        url: '/register'
    })
    nodes.push({
        id: 5,
        pid: 1,
        name: 'createorder',
        url: '/createorder'
    })

    function renderObject(node, nodes) {
        var csh = ''
        nodes.filter(n => {
            return n.pid == node.id
        }).forEach(
            c => {
                csh += `<li  data-url=${c.url}><input type="checkbox" @Change="n2" /><span @click="n1">${c.name}</span><select @change="n3"><option>1</option><option>2</option></select>${renderObject(c, nodes)}</li>`
            }
        )
        return csh == '' ? '' : `<ul>${csh}</ul>`
    }
    let obj = renderObject({
        id: null
    }, nodes)
    container.innerHTML = obj
    

    let els = container.getElementsByTagName('li');
    for (const el in els) {
        if(!els[el].children)return
        let ckb=els[el]?.children[0]
        console.log(ckb)
        ckb.onclick = function (e) {
            e.preventDefault()
            e.stopPropagation()
            if (e.target.dataset.url !== 'undefined')
                // calo.navigate(e.target.dataset.url)
            if (els[el].children[2])
            els[el].children[2].style.display = els[el].children[2].style.display == 'none' ? '' : 'none';
            calo.callPlugin(el, function () {
                // this.model.user = 22
            })
        }
    }
    container.getElementsByTagName('ul')[0].style.display = ''

}
