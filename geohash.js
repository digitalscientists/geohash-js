// geohash.js
// Geohash library for Javascript
// (c) 2008 David Troy
// Distributed under the MIT License

var GeohashClass = function() {
  this.BITS = [16, 8, 4, 2, 1];
  this.BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  this.NEIGHBORS = {
    right: {
      even: "bc01fg45238967deuvhjyznpkmstqrwx"
    },
  	left: {
  	  even: "238967debc01fg45kmstqrwxuvhjyznp"
  	},
  	top: {
  	  even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy"
  	},
  	bottom: {
  	  even: "14365h7k9dcfesgujnmqp0r2twvyx8zb"
  	}
  };
  this.BORDERS = {
    right: {
      even: "bcfguvyz"
    },
  	left: {
  	  even: "0145hjnp"
  	},
  	top: {
  	  even: "prxz"
  	},
  	bottom: {
  	  even: "028b"
  	}
  };
  this.NEIGHBORS.bottom.odd = this.NEIGHBORS.left.even;
  this.NEIGHBORS.top.odd = this.NEIGHBORS.right.even;
  this.NEIGHBORS.left.odd = this.NEIGHBORS.bottom.even;
  this.NEIGHBORS.right.odd = this.NEIGHBORS.top.even;
  this.BORDERS.bottom.odd = this.BORDERS.left.even;
  this.BORDERS.top.odd = this.BORDERS.right.even;
  this.BORDERS.left.odd = this.BORDERS.bottom.even;
  this.BORDERS.right.odd = this.BORDERS.top.even;
  this.ZOOMLEVELS = {
    3: 7,
    4 : 10,
    5 : 12,
    6 : 15,
    7 : 17,
    8 : 17
  };
  this.box = null;
  this.centerPoint = null;
  this.corners = {};
  this.geohash = null;
  this.grid_hashes = {
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
  this.map = null;
  this.neighbors = {};
  this.plot_color = '#07587f';
  this.plot_width = 4;
  this.selfPos = null;
  this.calculateAdjacent = function(srcHash, dir) {
  	srcHash = srcHash.toLowerCase();
  	var lastChr = srcHash.charAt(srcHash.length-1);
  	var type = (srcHash.length % 2) ? 'odd' : 'even';
  	var base = srcHash.substring(0,srcHash.length-1);
  	if (this.BORDERS[dir][type].indexOf(lastChr)!=-1) {
  		base = this.calculateAdjacent(base, dir);
  	}
  	return base + this.BASE32[this.NEIGHBORS[dir][type].indexOf(lastChr)];
  };
  this.decodeGeoHash = function(geohash) {
  	var is_even = 1;
  	var lat = []; var lon = [];
  	lat[0] = -90.0;  lat[1] = 90.0;
  	lon[0] = -180.0; lon[1] = 180.0;
  	lat_err = 90.0;  lon_err = 180.0;

  	for (i=0; i<geohash.length; i++) {
  		c = geohash[i];
  		cd = this.BASE32.indexOf(c);
  		for (j=0; j<5; j++) {
  			mask = this.BITS[j];
  			if (is_even) {
  				lon_err /= 2;
  				this.refine_interval(lon, cd, mask);
  			} else {
  				lat_err /= 2;
  				this.refine_interval(lat, cd, mask);
  			}
  			is_even = !is_even;
  		}
  	}
  	lat[2] = (lat[0] + lat[1])/2;
  	lon[2] = (lon[0] + lon[1])/2;

  	return { latitude: lat, longitude: lon};
  };
  this.encodeGeoHash = function(latitude, longitude) {
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
  				ch |= this.BITS[bit];
  				lon[0] = mid;
  	    } else {
  				lon[1] = mid;
  			}
  	  } else {
  			mid = (lat[0] + lat[1]) / 2;
  	    if (latitude > mid) {
  				ch |= this.BITS[bit];
  				lat[0] = mid;
  	    } else {
  				lat[1] = mid;
  			}
  	  }

  		is_even = !is_even;
  	  if (bit < 4) {
  			bit++;
  		} else {
  			geohash += this.BASE32[ch];
  			bit = 0;
  			ch = 0;
  	  }
  	}
  	return geohash;
  };
  this.GeoHashBox = function(geohash) {
  	this.geohash = geohash;
  	this.box = this.decodeGeoHash(geohash);
  	this.corners.topleft = this.GLatLng(this.box.latitude[0], this.box.longitude[0]);
  	this.corners.topright = this.GLatLng(this.box.latitude[1], this.box.longitude[0]);
  	this.corners.bottomright = this.GLatLng(this.box.latitude[1], this.box.longitude[1]);
  	this.corners.bottomleft = this.GLatLng(this.box.latitude[0], this.box.longitude[1]);
  	this.centerPoint = this.GLatLng((this.box.latitude[0] + this.box.latitude[1])/2, (this.box.longitude[0] + this.box.longitude[1])/2);
  	var lastChr = this.geohash.charAt(this.geohash.length-1);
  	this.selfPos = this.BASE32.indexOf(lastChr);
  	this.plot();
  	return geohash;
  };
  this.GLatLng = function(lat, lng) {
    return {
      Ga: lng,
      Nd: lat,
      x: lng,
      y: lat
    };
  };
  this.plot = function () {
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
      color: this.plot_color,
      width: this.plot_width
    };
    if(this.map) {
      this.map.addRoute(route);
    }
  };
  this.plotGeoHash = function(latlng, resolution) {
  	this.geohash = this.encodeGeoHash(latlng.lat, latlng.lng);
  	this.geohash = this.geohash.substr(0,resolution);
  	this.grid_hashes.center = this.geohash;
  	geoHashBox = this.GeoHashBox(this.geohash);
  	this.showNeighbors();
  };
  this.plotGridHashes = function() {
    annotations = [];
    if(this.grid_hashes) {
      var i;
      for(i in this.grid_hashes) {
        if(this.grid_hashes[i]) {
          latlng = this.decodeGeoHash(this.grid_hashes[i]);
          annotation = Titanium.Map.createAnnotation({
            animate: true,
            latitude: latlng.latitude[2],
            longitude: latlng.longitude[2],
            myid: 'a'+Math.random()+'z',
            pincolor: Titanium.Map.ANNOTATION_GREEN,
            title: this.grid_hashes[i]
          });
          annotations.push(annotation);
          if(this.map) {
            this.map.addAnnotation(annotation); 
          } 
        }
      }
    }
    return annotations;
  };
  this.refine_interval = function(interval, cd, mask) {
  	if (cd&mask) {
  		interval[0] = (interval[0] + interval[1])/2;
  	} else {
  		interval[1] = (interval[0] + interval[1])/2;
  	}
  };
  this.showNeighbors = function() {
  	var geohashPrefix = this.geohash.substr(0,this.geohash.length-1);
    
    neighbors = {};
    
  	this.grid_hashes.top = this.calculateAdjacent(this.geohash, 'top');
  	this.grid_hashes.bottom = this.calculateAdjacent(this.geohash, 'bottom');
  	this.grid_hashes.right = this.calculateAdjacent(this.geohash, 'right');
  	this.grid_hashes.left = this.calculateAdjacent(this.geohash, 'left');

  	neighbors.top = this.GeoHashBox(this.grid_hashes.top);
  	neighbors.bottom = this.GeoHashBox(this.grid_hashes.bottom);
  	neighbors.right = this.GeoHashBox(this.grid_hashes.right);
  	neighbors.left = this.GeoHashBox(this.grid_hashes.left);

  	this.grid_hashes.topleft = this.calculateAdjacent(neighbors.left, 'top');
  	this.grid_hashes.topright = this.calculateAdjacent(neighbors.right, 'top');
  	this.grid_hashes.bottomright = this.calculateAdjacent(neighbors.right, 'bottom');
  	this.grid_hashes.bottomleft = this.calculateAdjacent(neighbors.left, 'bottom');

  	neighbors.topleft = this.GeoHashBox(this.grid_hashes.topleft);
  	neighbors.topright = this.GeoHashBox(this.grid_hashes.topright);
  	neighbors.bottomright = this.GeoHashBox(this.grid_hashes.bottomright);
  	neighbors.bottomleft = this.GeoHashBox(this.grid_hashes.bottomleft);
  };
};