function dragger() { }

dragger.prototype = {
    setSrc: function (el, clone) {
        this.src = el
        this.clone = clone
        el.draggable = true
        el.addEventListener('dragstart', function (e) {
            setTimeout(() => {
                console.log(this);
            }, 10)
        });

        el.addEventListener('dragend', function () { });
        return this
    },
    setTargets: function () {
        let $g = this
        for (var i of arguments) {
            i.addEventListener('dragenter', dragEnter);
            i.addEventListener('dragover', dragOver);
            i.addEventListener('dragleave', dragLeave);
            i.addEventListener('drop', drop);
        }

        function dragEnter() {
            this.className += " holding";
        }

        function dragOver(e) {
            e.preventDefault();
        }

        function dragLeave() {
            this.className = 'empty';
        }

        function drop() {
            console.log('drop')
            this.className = 'empty';
            let el = $g.clone ? $g.src.cloneNode(true) : $g.src
            this.append(el)
        }
    },
}