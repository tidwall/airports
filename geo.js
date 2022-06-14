// http://www.movable-type.co.uk/scripts/latlong.html
function geoPointPointDist(x1, y1, x2, y2) {
    const R = 6371e3; // metres
    const φ1 = y1 * Math.PI/180; // φ, λ in radians
    const φ2 = y2 * Math.PI/180;
    const Δφ = (y2-y1) * Math.PI/180;
    const Δλ = (x2-x1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    return d;
}

// Algorithm from:
// Schubert, E., Zimek, A., & Kriegel, H.-P. (2013).
// Geodetic Distance Queries on R-Trees for Indexing Geographic Data.
// Lecture Notes in Computer Science, 146–164.
// doi:10.1007/978-3-642-40235-7_9
function geoPointRectDist(x, y, minX, minY, maxX, maxY) {
    var pLat = y;
    var pLng = x;
    var minLat = minY;
    var minLng = minX;
    var maxLat = maxY;
    var maxLng = maxX;
	return pointRectDistGeodeticRad(
		pLat*Math.PI/180, pLng*Math.PI/180,
		minLat*Math.PI/180, minLng*Math.PI/180,
		maxLat*Math.PI/180, maxLng*Math.PI/180,
	)
}

function pointRectDistGeodeticRad(φq, λq, φl, λl, φh, λh) {
    const twoΠ  = 2 * Math.PI;
    const halfΠ = Math.PI / 2;

	// distance on the unit sphere computed using Haversine formula
	var distRad = function(φa, λa, φb, λb) {
		if (φa == φb && λa == λb) {
			return 0;
		}
		var Δφ = φa - φb;
		var Δλ = λa - λb;
		var sinΔφ = Math.sin(Δφ / 2);
		var sinΔλ = Math.sin(Δλ / 2);
		var cosφa = Math.cos(φa);
		var cosφb = Math.cos(φb);
		return 2 * Math.asin(Math.sqrt(sinΔφ*sinΔφ+sinΔλ*sinΔλ*cosφa*cosφb));
	}

	// Simple case, point or invalid rect
	if (φl >= φh && λl >= λh) {
		return distRad(φl, λl, φq, λq);
	}

	if (λl <= λq && λq <= λh) {
		// q is between the bounding meridians of r
		// hence, q is north, south or within r
		if (φl <= φq && φq <= φh) { // Inside
			return 0;
		}

		if (φq < φl) { // South
			return φl - φq;
		}

		return φq - φh; // North
	}

	// determine if q is closer to the east or west edge of r to select edge for
	// tests below
	var Δλe = λl - λq;
	var Δλw = λq - λh;
	if (Δλe < 0) {
		Δλe += twoΠ;
	}
	if (Δλw < 0) {
		Δλw += twoΠ;
	}
	var Δλ;    // distance to closest edge
	var λedge; // longitude of closest edge
	if (Δλe <= Δλw) {
		Δλ = Δλe
		λedge = λl
	} else {
		Δλ = Δλw
		λedge = λh
	}

	var sinΔλ = Math.sin(Δλ);
    var cosΔλ = Math.cos(Δλ);
	var tanφq = Math.tan(φq);

	if (Δλ >= halfΠ) {
		// If Δλ > 90 degrees (1/2 pi in radians) we're in one of the corners
		// (NW/SW or NE/SE depending on the edge selected). Compare against the
		// center line to decide which case we fall into
		var φmid = (φh + φl) / 2;
		if (tanφq >= Math.tan(φmid)*cosΔλ) {
			return distRad(φq, λq, φh, λedge); // North corner
		}
		return distRad(φq, λq, φl, λedge); // South corner
	}

	if (tanφq >= Math.tan(φh)*cosΔλ) {
		return distRad(φq, λq, φh, λedge); // North corner
	}

	if (tanφq <= Math.tan(φl)*cosΔλ) {
		return distRad(φq, λq, φl, λedge); // South corner
	}

	// We're to the East or West of the rect, compute distance using cross-track
	// Note that this is a simplification of the cross track distance formula
	// valid since the track in question is a meridian.
	return Math.asin(Math.cos(φq) * sinΔλ);
}