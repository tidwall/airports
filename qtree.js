QTree = (function(){
    function Queue() {
        this.items = [];
    }
    Queue.prototype.push = function(item) {
        this.items.push(item);
        var i = this.items.length - 1;
        while (i != 0) {
            var parent = Math.floor((i - 1) / 2);
            if (!(this.items[parent].dist > this.items[i].dist)) {
                break;
            }
            var tmp = this.items[parent];
            this.items[parent] = this.items[i];
            this.items[i] = tmp;
            i = parent;
        }
    }
    Queue.prototype.pop = function() {
        if (this.items.length == 0) {
            return null;
        }
        var n = this.items[0];
        this.items[0] = this.items[this.items.length-1];
        this.items.length--;
        var i = 0;
        for (;;) {
            var smallest = i;
            var left = i * 2 + 1;
            var right = i * 2 + 2;
            if (left < this.items.length && this.items[left].dist <= this.items[smallest].dist) {
                smallest = left;
            }
            if (right < this.items.length && this.items[right].dist <= this.items[smallest].dist) {
                smallest = right;
            }
            if (smallest == i) {
                break;
            }
            var tmp = this.items[smallest];
            this.items[smallest] = this.items[i];
            this.items[i] = tmp;
            i = smallest;
        }
        return n;
    }
    const MAX_ITEMS = 8;
    var QTree = function(minX, minY, maxX, maxY) {
        this.node = true;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        this.midX = (minX+maxX)/2;
        this.midY = (minY+maxY)/2;
        this.leaf = true;
        this.items = [];
    }
    QTree.prototype.split = function() {
        var items = this.items;
        delete this.items;
        delete this.leaf;
        this.quads = [
            new QTree(this.minX, this.midY, this.midX, this.maxY),
            new QTree(this.midX, this.midY, this.maxX, this.maxY),
            new QTree(this.minX, this.minY, this.midX, this.midY),
            new QTree(this.midX, this.minY, this.maxX, this.midY),
        ];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            this.insert(item.x, item.y, item.data);
        }
    }
    function intersects(x, y, minX, minY, maxX, maxY) {
        return !(x > maxX || x < minX || y > maxY || y < minY);
    }
    QTree.prototype.intersects = function(x, y) {
        return intersects(x, y, this.minX, this.minY, this.maxX, this.maxY);
    }
    QTree.prototype.insert = function(x, y, data) {
        if (this.leaf) {
            if (this.items.length == MAX_ITEMS) {
                this.split();
                return this.insert(x, y, data);
            }
            this.items.push({x, y, data});
            return;
        }
        var quad;
        for (var i = 0; i < this.quads.length; i++) {
            quad = this.quads[i];
            if (quad.intersects(x, y, x, y)) {
                break;
            }
        }
        quad.insert(x, y, data);
    }
    function pointDist(x1, y1, x2, y2) {
        return geoPointPointDist(x1, y1, x2, y2);
    }
    function rectDist(x, y, minX, minY, maxX, maxY) {
        if (intersects(x, y, minX, minY, maxX, maxY)) {
            return 0;
        }
        return geoPointRectDist(x, y, minX, minY, maxX, maxY);
    }
    QTree.prototype.nearby = function(x, y, iter) {
        var q = new Queue();
        var n = this;
        q.push({
            dist: rectDist(x, y, n.minX, n.minY, n.maxX, n.maxY),
            data: n
        });
        for (;;) {
            var item = q.pop();
            if (!item) {
                break;
            }
            if (item.data.node) {
                var n = item.data;
                if (n.leaf) {
                    for (var i = 0; i < n.items.length; i++) {
                        var v = n.items[i];
                        q.push({
                            dist: pointDist(x, y, v.x, v.y),
                            data: v
                        });
                    }
                } else {
                    for (var i = 0; i < n.quads.length; i++) {
                        var v = n.quads[i];
                        q.push({
                            dist: rectDist(x, y, v.minX, v.minY, v.maxX, v.maxY),
                            data: v
                        });
                    }
                }
            } else {
                if (!iter(item.dist, item.data)) {
                    return;
                }
            }
        }
    }
    return QTree;
}());
