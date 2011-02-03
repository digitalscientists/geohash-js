// geohash.js
// Geohash library for Javascript
// (c) 2008 David Troy
// Distributed under the MIT License

BITS = [16, 8, 4, 2, 1];

BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
NEIGHBORS = { right  : { even :  "bc01fg45238967deuvhjyznpkmstqrwx" },
							left   : { even :  "238967debc01fg45kmstqrwxuvhjyznp" },
							top    : { even :  "p0r21436x8zb9dcf5h7kjnmqesgutwvy" },
							bottom : { even :  "14365h7k9dcfesgujnmqp0r2twvyx8zb" } };
BORDERS   = { right  : { even : "bcfguvyz" },
							left   : { even : "0145hjnp" },
							top    : { even : "prxz" },
							bottom : { even : "028b" } };

NEIGHBORS.bottom.odd = NEIGHBORS.left.even;
NEIGHBORS.top.odd = NEIGHBORS.right.even;
NEIGHBORS.left.odd = NEIGHBORS.bottom.even;
NEIGHBORS.right.odd = NEIGHBORS.top.even;

BORDERS.bottom.odd = BORDERS.left.even;
BORDERS.top.odd = BORDERS.right.even;
BORDERS.left.odd = BORDERS.bottom.even;
BORDERS.right.odd = BORDERS.top.even;

var final_hashes = {
  bottom: null,
  bottomleft: null,
  bottomright: null,
  center: null,
  left: null,
  right: null,
  top: null,
  topleft: null,
  topright: null
};

function refine_interval(interval, cd, mask) {
	if (cd&mask) {
		interval[0] = (interval[0] + interval[1])/2;
	} else {
		interval[1] = (interval[0] + interval[1])/2;
	}
}

function calculateAdjacent(srcHash, dir) {
	srcHash = srcHash.toLowerCase();
	var lastChr = srcHash.charAt(srcHash.length-1);
	var type = (srcHash.length % 2) ? 'odd' : 'even';
	var base = srcHash.substring(0,srcHash.length-1);
	if (BORDERS[dir][type].indexOf(lastChr)!=-1) {
		base = calculateAdjacent(base, dir);
	}
	return base + BASE32[NEIGHBORS[dir][type].indexOf(lastChr)];
}

function decodeGeoHash(geohash) {
	var is_even = 1;
	var lat = []; var lon = [];
	lat[0] = -90.0;  lat[1] = 90.0;
	lon[0] = -180.0; lon[1] = 180.0;
	lat_err = 90.0;  lon_err = 180.0;
	
	for (i=0; i<geohash.length; i++) {
		c = geohash[i];
		cd = BASE32.indexOf(c);
		for (j=0; j<5; j++) {
			mask = BITS[j];
			if (is_even) {
				lon_err /= 2;
				refine_interval(lon, cd, mask);
			} else {
				lat_err /= 2;
				refine_interval(lat, cd, mask);
			}
			is_even = !is_even;
		}
	}
	lat[2] = (lat[0] + lat[1])/2;
	lon[2] = (lon[0] + lon[1])/2;

	return { latitude: lat, longitude: lon};
}

function encodeGeoHash(latitude, longitude) {
	var is_even=1;
	var i=0;
	var lat = []; var lon = [];
	var bit=0;
	var ch=0;
	var precision = 12;
	geohash = "";

	lat[0] = -90.0;  lat[1] = 90.0;
	lon[0] = -180.0; lon[1] = 180.0;
	
	while (geohash.length < precision) {
	  if (is_even) {
			mid = (lon[0] + lon[1]) / 2;
	    if (longitude > mid) {
				ch |= BITS[bit];
				lon[0] = mid;
	    } else {
				lon[1] = mid;
			}
	  } else {
			mid = (lat[0] + lat[1]) / 2;
	    if (latitude > mid) {
				ch |= BITS[bit];
				lat[0] = mid;
	    } else {
				lat[1] = mid;
			}
	  }

		is_even = !is_even;
	  if (bit < 4) {
			bit++;
		} else {
			geohash += BASE32[ch];
			bit = 0;
			ch = 0;
	  }
	}
	return geohash;
}

// geohash.js
// Geohash library for Javascript
// (c) 2008 David Troy
// Code is available for free distribution under the MIT License

var ZOOMLEVELS = { 3: 7, 4 : 10, 5 : 12, 6 : 15, 7 : 17, 8 : 17 };

function GLatLng(lat, lng) {
  return {
    Ga: lng,
    Nd: lat,
    x: lng,
    y: lat
  };
}

function GeoHashBox (geohash) {
	this.geohash = geohash;
	this.box = decodeGeoHash(geohash);
	this.corners = {};
	this.corners.topleft = GLatLng(this.box.latitude[0], this.box.longitude[0]);
	this.corners.topright = GLatLng(this.box.latitude[1], this.box.longitude[0]);
	this.corners.bottomright = GLatLng(this.box.latitude[1], this.box.longitude[1]);
	this.corners.bottomleft = GLatLng(this.box.latitude[0], this.box.longitude[1]);
	this.centerPoint = GLatLng((this.box.latitude[0] + this.box.latitude[1])/2, (this.box.longitude[0] + this.box.longitude[1])/2);
	this.options = {labelText : geohash};
	var lastChr = this.geohash.charAt(this.geohash.length-1);
	this.selfPos = BASE32.indexOf(lastChr);
	this.neighbors = {};
	this.plot();
}

GeoHashBox.prototype.centerMap = function () {
  //map.setCenter(this.centerPoint, ZOOMLEVELS[this.geohash.length]);
};
	
GeoHashBox.prototype.showNeighbors = function () {
	var geohashPrefix = this.geohash.substr(0,this.geohash.length-1);
	
	final_hashes.top = calculateAdjacent(this.geohash, 'top');
	final_hashes.bottom = calculateAdjacent(this.geohash, 'bottom');
	final_hashes.right = calculateAdjacent(this.geohash, 'right');
	final_hashes.left = calculateAdjacent(this.geohash, 'left');
	 
	this.neighbors.top = new GeoHashBox(final_hashes.top);
	this.neighbors.bottom = new GeoHashBox(final_hashes.bottom);
	this.neighbors.right = new GeoHashBox(final_hashes.right);
	this.neighbors.left = new GeoHashBox(final_hashes.left);
	
	final_hashes.topleft = calculateAdjacent(this.neighbors.left.geohash, 'top');
	final_hashes.topright = calculateAdjacent(this.neighbors.right.geohash, 'top');
	final_hashes.bottomright = calculateAdjacent(this.neighbors.right.geohash, 'bottom');
	final_hashes.bottomleft = calculateAdjacent(this.neighbors.left.geohash, 'bottom');
	
	this.neighbors.topleft = new GeoHashBox(final_hashes.topleft);
	this.neighbors.topright = new GeoHashBox(final_hashes.topright);
	this.neighbors.bottomright = new GeoHashBox(final_hashes.bottomright);
	this.neighbors.bottomleft = new GeoHashBox(final_hashes.bottomleft);
};

GeoHashBox.prototype.plot = function () {
  route = {
    name: 'a'+Math.random()+'z',
    points: [
      {
        latitude: this.corners.bottomleft.y,
        longitude: this.corners.bottomleft.x
      },
      {
        latitude: this.corners.bottomright.y,
        longitude: this.corners.bottomright.x
      },
      {
        latitude: this.corners.topright.y,
        longitude: this.corners.topright.x
      },
      {
        latitude: this.corners.topleft.y,
        longitude: this.corners.topleft.x
      },
      {
        latitude: this.corners.bottomleft.y,
        longitude: this.corners.bottomleft.x
      }
    ],
    color: '#07587f',
    width: 4
  };
  if(mapview) {
    mapview.addRoute(route);
  }
};

function plotGeoHash (latlng, resolution, map) {
	var geohash = encodeGeoHash(latlng.lat, latlng.lng);
	geohash = geohash.substr(0,resolution);
	final_hashes.center = geohash;
	var geoHashBox = new GeoHashBox(geohash);
	geoHashBox.showNeighbors();
}