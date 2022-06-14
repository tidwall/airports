Globe = (function(){
    const graticuleLineStep = 5.0;
    const linePointInterval = 500.0;
    const earthRadius = 6371.0
    
    function degToRad(d) { return Math.PI * d / 180.0 }
    function radToDeg(r) { return 180.0 * r / Math.PI }
    function sin(d) { return Math.sin(degToRad(d)) }
    function cos(d) { return Math.cos(degToRad(d)) }

    function cartestian(lat, lng) {
        return {
            x: cos(lat) * cos(lng),
            y: cos(lat) * sin(lng),
            z: -sin(lat),
        }
    }
    function haversine(lat1, lng1, lat2, lng2) {
        var dlat = lat2 - lat1;
        var dlng = lng2 - lng1;
        var a = sin(dlat/2)*sin(dlat/2) + cos(lat1)*cos(lat2)*sin(dlng/2)*sin(dlng/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return earthRadius * c;
    }
    function intermediate(lat1, lng1, lat2, lng2, f) {
        var dr = haversine(lat1, lng1, lat2, lng2) / earthRadius;
        var a = Math.sin((1-f)*dr) / Math.sin(dr);
        var b = Math.sin(f*dr) / Math.sin(dr);
        var x = a*cos(lat1)*cos(lng1) + b*cos(lat2)*cos(lng2);
        var y = a*cos(lat1)*sin(lng1) + b*cos(lat2)*sin(lng2);
        var z = a*sin(lat1) + b*sin(lat2);
        var phi = Math.atan2(z, Math.sqrt(x*x+y*y));
        var lambda = Math.atan2(y, x);
        return {lat:radToDeg(phi), lng:radToDeg(lambda)};
    }
    function Globe(){
        this.p = new Pinhole();
        this.style = {};
	}
    Globe.prototype.drawParallel = function(lat, style) {
        // this.p.begin();
        for (var lng = -180.0; lng < 180.0; lng += graticuleLineStep) {
            var p1 = cartestian(lat, lng);
            var p2 = cartestian(lat, lng+graticuleLineStep);
            this.p.drawLine(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
        // this.p.end();
    }
    Globe.prototype.drawParallels = function(interval, style) {
        this.drawParallel(0, style);
        for (var lat = interval; lat < 90.0; lat += interval) {
            this.drawParallel(lat, style);
            this.drawParallel(-lat, style);
        }
    }
    Globe.prototype.drawMeridian = function(lng, style) {
        // this.p.begin();
        for (var lat = -90.0; lat < 90.0; lat += graticuleLineStep) {
            var p1 = cartestian(lat, lng)
            var p2 = cartestian(lat+graticuleLineStep, lng)
            this.p.drawLine(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
        // this.p.end();
    }
    Globe.prototype.drawMeridians = function(interval, style) {
        for (var lng = -180.0; lng < 180.0; lng += interval) {
            this.drawMeridian(lng, style)
        }
    }
    Globe.prototype.drawGraticule = function(interval, style) {
        this.drawParallels(interval, style)
        this.drawMeridians(interval, style)
    }
    // Globe.prototype.drawLandBoundaries = function(style) {
    //     this.drawPreparedPaths(land(), style)
    // }
    Globe.prototype.drawPreparedPaths = function(paths, style) {
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            var n = path.length;
            for (var j = 0; j+1 < n; j++) {
                var gp1 = path[j];
                var gp2 = path[j+1];
                var p1 = cartestian(gp1[0], gp1[1]);
                var p2 = cartestian(gp2[0], gp2[1]);
                this.p.drawLine(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
        }
    }
    Globe.prototype.drawLine = function(lat1, lng1, lat2, lng2, style) {
        // defer g.styled(Color(g.style.LineColor), style...)()
        var d = haversine(lat1, lng1, lat2, lng2);
        var step = d / Math.ceil(d/linePointInterval);
        var f = cartestian(lat1, lng1);
        for (var p = step; p < d-step/2; p += step) {
            var tll = intermediate(lat1, lng1, lat2, lng2, p/d);
            var t = cartestian(tll.lat, tll.lng);
            this.p.drawLine(f.x, f.y, f.z, t.x, t.y, t.z);
            f = t;
        }
        var t = cartestian(lat2, lng2);
        this.p.drawLine(f.x, f.y, f.z, t.x, t.y, t.z);
    }

    Globe.prototype.centerOn = function(lat, lng) {
        this.p.rotate(0, 0, -degToRad(lng)-Math.PI/2);
        this.p.rotate(Math.PI/2-degToRad(lat), 0, 0);
    }

    Globe.prototype.drawDot = function(lat, lng, radius, style) {
        // defer g.styled(Color(g.style.DotColor), style...)()
        var p = cartestian(lat, lng);
        this.p.drawDot(p.x, p.y, p.z, radius)
    }

    Globe.prototype.render = function(canvas, opts){
        opts = opts?opts:{};
        opts.scale = 0.65;
        opts.lineWidth = 0.1;
        this.p.render(canvas, opts);
    }
    return Globe;
}());

