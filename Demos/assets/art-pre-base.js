/*
---
name: Color
description: Class to create and manipulate colors. Includes HSB «-» RGB «-» HEX conversions. Supports alpha for each type.
requires: [Core/Type, Core/Array]
provides: Color
...
*/

(function(){

var colors = {
	maroon: '#800000', red: '#ff0000', orange: '#ffA500', yellow: '#ffff00', olive: '#808000',
	purple: '#800080', fuchsia: "#ff00ff", white: '#ffffff', lime: '#00ff00', green: '#008000',
	navy: '#000080', blue: '#0000ff', aqua: '#00ffff', teal: '#008080',
	black: '#000000', silver: '#c0c0c0', gray: '#808080'
};

var Color = this.Color = function(color, type){
	
	if (color.isColor){
		
		this.red = color.red;
		this.green = color.green;
		this.blue = color.blue;
		this.alpha = color.alpha;

	} else {
		
		var namedColor = colors[color];
		if (namedColor){
			color = namedColor;
			type = 'hex';
		}

		switch (typeof color){
			case 'string': if (!type) type = (type = color.match(/^rgb|^hsb/)) ? type[0] : 'hex'; break;
			case 'object': type = type || 'rgb'; color = color.toString(); break;
			case 'number': type = 'hex'; color = color.toString(16); break;
		}

		color = Color['parse' + type.toUpperCase()](color);
		this.red = color[0];
		this.green = color[1];
		this.blue = color[2];
		this.alpha = color[3];
	}
	
	this.isColor = true;

};

var limit = function(number, min, max){
	return Math.min(max, Math.max(min, number));
};

var listMatch = /([-.\d]+)\s*,\s*([-.\d]+)\s*,\s*([-.\d]+)\s*,?\s*([-.\d]*)/;
var hexMatch = /^#?([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{0,2})$/i;

Color.parseRGB = function(color){
	return color.match(listMatch).slice(1).map(function(bit, i){
		return (i < 3) ? Math.round(((bit %= 256) < 0) ? bit + 256 : bit) : limit(((bit === '') ? 1 : Number(bit)), 0, 1);
	});
};
	
Color.parseHEX = function(color){
	if (color.length == 1) color = color + color + color;
	return color.match(hexMatch).slice(1).map(function(bit, i){
		if (i == 3) return (bit) ? parseInt(bit, 16) / 255 : 1;
		return parseInt((bit.length == 1) ? bit + bit : bit, 16);
	});
};
	
Color.parseHSB = function(color){
	var hsb = color.match(listMatch).slice(1).map(function(bit, i){
		if (i === 0) return Math.round(((bit %= 360) < 0) ? (bit + 360) : bit);
		else if (i < 3) return limit(Math.round(bit), 0, 100);
		else return limit(((bit === '') ? 1 : Number(bit)), 0, 1);
	});
	
	var a = hsb[3];
	var br = Math.round(hsb[2] / 100 * 255);
	if (hsb[1] == 0) return [br, br, br, a];
		
	var hue = hsb[0];
	var f = hue % 60;
	var p = Math.round((hsb[2] * (100 - hsb[1])) / 10000 * 255);
	var q = Math.round((hsb[2] * (6000 - hsb[1] * f)) / 600000 * 255);
	var t = Math.round((hsb[2] * (6000 - hsb[1] * (60 - f))) / 600000 * 255);

	switch (Math.floor(hue / 60)){
		case 0: return [br, t, p, a];
		case 1: return [q, br, p, a];
		case 2: return [p, br, t, a];
		case 3: return [p, q, br, a];
		case 4: return [t, p, br, a];
		default: return [br, p, q, a];
	}
};

var toString = function(type, array){
	if (array[3] != 1) type += 'a';
	else array.pop();
	return type + '(' + array.join(', ') + ')';
};

Color.prototype = {

	toHSB: function(array){
		var red = this.red, green = this.green, blue = this.blue, alpha = this.alpha;

		var max = Math.max(red, green, blue), min = Math.min(red, green, blue), delta = max - min;
		var hue = 0, saturation = (max != 0) ? delta / max : 0, brightness = max / 255;
		if (saturation){
			var rr = (max - red) / delta, gr = (max - green) / delta, br = (max - blue) / delta;
			hue = (red == max) ? br - gr : (green == max) ? 2 + rr - br : 4 + gr - rr;
			if ((hue /= 6) < 0) hue++;
		}

		var hsb = [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100), alpha];

		return (array) ? hsb : toString('hsb', hsb);
	},

	toHEX: function(array){

		var a = this.alpha;
		var alpha = ((a = Math.round((a * 255)).toString(16)).length == 1) ? a + a : a;
		
		var hex = [this.red, this.green, this.blue].map(function(bit){
			bit = bit.toString(16);
			return (bit.length == 1) ? '0' + bit : bit;
		});
		
		return (array) ? hex.concat(alpha) : '#' + hex.join('') + ((alpha == 'ff') ? '' : alpha);
	},
	
	toRGB: function(array){
		var rgb = [this.red, this.green, this.blue, this.alpha];
		return (array) ? rgb : toString('rgb', rgb);
	}

};

Color.prototype.toString = Color.prototype.toRGB;

Color.hex = function(hex){
	return new Color(hex, 'hex');
};

if (this.hex == null) this.hex = Color.hex;

Color.hsb = function(h, s, b, a){
	return new Color([h || 0, s || 0, b || 0, (a == null) ? 1 : a], 'hsb');
};

if (this.hsb == null) this.hsb = Color.hsb;

Color.rgb = function(r, g, b, a){
	return new Color([r || 0, g || 0, b || 0, (a == null) ? 1 : a], 'rgb');
};

if (this.rgb == null) this.rgb = Color.rgb;

if (this.Type) new Type('Color', Color);

})();


/*
---
name: Table
description: LUA-Style table implementation.
requires: [Core/Type, Core/Array]
provides: Table
...
*/

(function(){

var Table = this.Table = function(){

	this.length = 0;
	var keys = [], values = [];
	
	this.set = function(key, value){
		var index = keys.indexOf(key);
		if (index == -1){
			var length = keys.length;
			keys[length] = key;
			values[length] = value;
			this.length++;
		} else {
			values[index] = value;
		}
		return this;
	};

	this.get = function(key){
		var index = keys.indexOf(key);
		return (index == -1) ? null : values[index];
	};

	this.erase = function(key){
		var index = keys.indexOf(key);
		if (index != -1){
			this.length--;
			keys.splice(index, 1);
			return values.splice(index, 1)[0];
		}
		return null;
	};

	this.each = this.forEach = function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++) fn.call(bind, keys[i], values[i], this);
	};
	
};

if (this.Type) new Type('Table', Table);

})();



/*
---
name: ART
description: "The heart of ART."
requires: [Core/Class, Color/Color, Table/Table]
provides: [ART, ART.Element, ART.Container]
...
*/

(function(){

this.ART = new Class;

ART.version = '0.87';
ART.build = '37db3609c6e0df4c215737df9c3c5851d1e9c30c';

ART.Element = new Class({
	
	/* dom */

	inject: function(element){
		if (element.element) element = element.element;
		element.appendChild(this.element);
		return this;
	},
	
	eject: function(){
		var element = this.element, parent = element.parentNode;
		if (parent) parent.removeChild(element);
		return this;
	},
	
	/* events */
	
	listen: function(type, fn){
		if (!this._events) this._events = {};
		
		if (typeof type != 'string'){ // listen type / fn with object
			for (var t in type) this.listen(t, type[t]);
		} else { // listen to one
			if (!this._events[type]) this._events[type] = new Table;
			var events = this._events[type];
			if (events.get(fn)) return this;
			var bound = fn.bind(this);
			events.set(fn, bound);
			var element = this.element;
			if (element.addEventListener) element.addEventListener(type, bound, false);
			else element.attachEvent('on' + type, bound);
		}

		return this;
	},
	
	ignore: function(type, fn){
		if (!this._events) return this;
		
		if (typeof type != 'string'){ // ignore type / fn with object
			for (var t in type) this.ignore(t, type[t]);
			return this;
		}
		
		var events = this._events[type];
		if (!events) return this;
		
		if (fn == null){ // ignore every of type
			events.each(function(fn, bound){
				this.ignore(type, fn);
			}, this);
		} else { // ignore one
			var bound = events.get(fn);
			if (!bound) return this;
			var element = this.element;
			if (element.removeEventListener) element.removeEventListener(type, bound, false);
			else element.detachEvent('on' + type, bound);
		}

		return this;
	}

});

ART.Container = new Class({

	grab: function(){
		for (var i = 0; i < arguments.length; i++) arguments[i].inject(this);
		return this;
	}

});

var UID = 0;

ART.uniqueID = function(){
	return (new Date().getTime() + (UID++)).toString(36);
};

Color.detach = function(color){
	color = new Color(color);
	return [Color.rgb(color.red, color.green, color.blue).toString(), color.alpha];
};

})();



/*
---
name: ART.Path
description: "Class to generate a valid SVG path using method calls."
authors: ["[Valerio Proietti](http://mad4milk.net)", "[Sebastian Markbåge](http://calyptus.eu/)"]
provides: ART.Path
requires: ART
...
*/

(function(){

/* private functions */

var parse = function(path){

	var parts = [], index = -1,
	    bits = path.match(/[a-df-z]|[\-+]?(?:[\d\.]e[\-+]?|[^\s\-+,a-z])+/ig);

	for (var i = 0, l = bits.length; i < l; i++){
		var bit = bits[i];
		if (bit.match(/^[a-z]/i)) parts[++index] = [bit];
		else parts[index].push(Number(bit));
	}
	
	return parts;

};

var circle = Math.PI * 2, north = circle / 2, west = north / 2, east = -west, south = 0;

var calculateArc = function(rx, ry, rotation, large, clockwise, x, y, tX, tY){
	var cx = x / 2, cy = y / 2,
		rxry = rx * rx * ry * ry, rycx = ry * ry * cx * cx, rxcy = rx * rx * cy * cy,
		a = rxry - rxcy - rycx;

	if (a < 0){
		a = Math.sqrt(1 - a / rxry);
		rx *= a; ry *= a;
	} else {
		a = Math.sqrt(a / (rxcy + rycx));
		if (large == clockwise) a = -a;
		cx += -a * y / 2 * rx / ry;
		cy +=  a * x / 2 * ry / rx;
	}

	var sa = Math.atan2(cx, -cy), ea = Math.atan2(-x + cx, y - cy);
	if (!+clockwise){ var t = sa; sa = ea; ea = t; }
	if (ea < sa) ea += circle;

	cx += tX; cy += tY;

	return {
		circle: [cx - rx, cy - ry, cx + rx, cy + ry],
		boundsX: [
			ea > circle + west || (sa < west && ea > west) ? cx - rx : tX,
			ea > circle + east || (sa < east && ea > east) ? cx + rx : tX
		],
		boundsY: [
			ea > north ? cy - ry : tY,
			ea > circle + south || (sa < south && ea > south) ? cy + ry : tY
		]
	};
};

var extrapolate = function(parts, precision){
	
	var boundsX = [], boundsY = [];
	
	var ux = (precision != null) ? function(x){
		boundsX.push(x); return Math.round(x * precision);
	} : function(x){
		boundsX.push(x); return x;
	}, uy = (precision != null) ? function(y){
		boundsY.push(y); return Math.round(y * precision);
	} : function(y){
		boundsY.push(y); return y;
	}, np = (precision != null) ? function(v){
		return Math.round(v * precision);
	} : function(v){
		return v;
	};

	var reflect = function(sx, sy, ex, ey){
		return [ex * 2 - sx, ey * 2 - sy];
	};
	
	var X = 0, Y = 0, px = 0, py = 0, r;
	
	var path = '', inX, inY;
	
	for (i = 0; i < parts.length; i++){
		var v = Array.slice(parts[i]), f = v.shift(), l = f.toLowerCase();
		var refX = l == f ? X : 0, refY = l == f ? Y : 0;
		
		if (l != 'm' && inX == null){
			inX = X; inY = Y;
		}

		switch (l){
			
			case 'm':
				path += 'm' + ux(X = refX + v[0]) + ',' + uy(Y = refY + v[1]);
			break;
			
			case 'l':
				path += 'l' + ux(X = refX + v[0]) + ',' + uy(Y = refY + v[1]);
			break;
			
			case 'c':
				px = refX + v[2]; py = refY + v[3];
				path += 'c' + ux(refX + v[0]) + ',' + uy(refY + v[1]) + ',' + ux(px) + ',' + uy(py) + ',' + ux(X = refX + v[4]) + ',' + uy(Y = refY + v[5]);
			break;

			case 's':
				r = reflect(px, py, X, Y);
				px = refX + v[0]; py = refY + v[1];
				path += 'c' + ux(r[0]) + ',' + uy(r[1]) + ',' + ux(px) + ',' + uy(py) + ',' + ux(X = refX + v[2]) + ',' + uy(Y = refY + v[3]);
			break;
			
			case 'q':
				px = refX + v[0]; py = refY + v[1];
				path += 'c' + ux(refX + v[0]) + ',' + uy(refY + v[1]) + ',' + ux(px) + ',' + uy(py) + ',' + ux(X = refX + v[2]) + ',' + uy(Y = refY + v[3]);
			break;
			
			case 't':
				r = reflect(px, py, X, Y);
				px = refX + r[0]; py = refY + r[1];
				path += 'c' + ux(px) + ',' + uy(py) + ',' + ux(px) + ',' + uy(py) + ',' + ux(X = refX + v[0]) + ',' + uy(Y = refY + v[1]);
			break;

			case 'a':
				px = refX + v[5]; py = refY + v[6];

				if (!+v[0] || !+v[1] || (px == X && py == Y)){
					path += 'l' + ux(X = px) + ',' + uy(Y = py);
					break;
				}
				
				v[7] = X; v[8] = Y;
				r = calculateArc.apply(null, v);

				boundsX.push.apply(boundsX, r.boundsX);
				boundsY.push.apply(boundsY, r.boundsY);

				path += (v[4] == 1 ? 'wa' : 'at') + r.circle.map(np) + ',' + ux(X) + ',' + uy(Y) + ',' + ux(X = px) + ',' + uy(Y = py);
			break;

			case 'h':
				path += 'l' + ux(X = refX + v[0]) + ',' + uy(Y);
			break;
			
			case 'v':
				path += 'l' + ux(X) + ',' + uy(Y = refY + v[0]);
			break;
			
			case 'z':
				path += 'x';
				if (inX != null){
					path += 'm' + ux(X = inX) + ',' + uy(Y = inY);
					inX = null;
				}
			break;
			
		}
	}
	
	var right = Math.max.apply(Math, boundsX),
		bottom = Math.max.apply(Math, boundsY),
		left = Math.min.apply(Math, boundsX),
		top = Math.min.apply(Math, boundsY),
		height = bottom - top,
		width = right - left;
	
	return [path, {left: left, top: top, right: right, bottom: bottom, width: width, height: height}];

};

/* Path Class */

ART.Path = new Class({
	
	initialize: function(path){
		if (path instanceof ART.Path){ //already a path, copying
			this.path = Array.slice(path.path);
			this.box = path.box;
			this.vml = path.vml;
			this.svg = path.svg;
		} else {
			this.path = (path == null) ? [] : parse(path);
			this.box = null;
			this.vml = null;
			this.svg = null;
		}

		return this;
	},
	
	push: function(){ //modifying the current path resets the memoized values.
		this.box = null;
		this.vml = null;
		this.svg = null;
		this.path.push(Array.slice(arguments));
		return this;
	},
	
	reset: function(){
		this.box = null;
		this.vml = null;
		this.svg = null;
		this.path = [];
		return this;
	},
	
	/*utility*/
	
	move: function(x, y){
		return this.push('m', x, y);
	},
	
	line: function(x, y){
		return this.push('l', x, y);
	},
	
	close: function(){
		return this.push('z');
	},
	
	bezier: function(c1x, c1y, c2x, c2y, ex, ey){
		return this.push('c', c1x, c1y, c2x, c2y, ex, ey);
	},
	
	arc: function(x, y, rx, ry, large){
		return this.push('a', Math.abs(rx || x), Math.abs(ry || rx || y), 0, large ? 1 : 0, 1, x, y);
	},
	
	counterArc: function(x, y, rx, ry, large){
		return this.push('a', Math.abs(rx || x), Math.abs(ry || rx || y), 0, large ? 1 : 0, 0, x, y);
	},
	
	/* transformation, measurement */
	
	toSVG: function(){
		if (this.svg == null){
			var path = '';
			for (var i = 0, l = this.path.length; i < l; i++) path += this.path[i].join(' ');
			this.svg = path;
		}
		return this.svg;
	},
	
	toVML: function(precision){
		if (this.vml == null){
			var data = extrapolate(this.path, precision);
			this.box = data[1];
			this.vml = data[0];
		}
		return this.vml;
	},
	
	measure: function(precision){
		if (this.box == null){
					
			if (this.path.length){
				var data = extrapolate(this.path, precision);
				this.box = data[1];
				this.vml = data[2];
			} else {
				this.box = {left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0};
				this.vml = '';
				this.svg = '';
			}
		
		}
		
		return this.box;
	}
	
});

ART.Path.prototype.toString = ART.Path.prototype.toSVG;

})();


/*
---
name: ART.SVG
description: "SVG implementation for ART"
provides: [ART.SVG, ART.SVG.Group, ART.SVG.Shape, ART.SVG.Image]
requires: [ART, ART.Element, ART.Container, ART.Path]
...
*/

(function(){
	
var NS = 'http://www.w3.org/2000/svg', XLINK = 'http://www.w3.org/1999/xlink', UID = 0, createElement = function(tag){
	return document.createElementNS(NS, tag);
};

// SVG Base Class

ART.SVG = new Class({

	Extends: ART.Element,
	Implements: ART.Container,

	initialize: function(width, height){
		var element = this.element = createElement('svg');
		element.setAttribute('xmlns', NS);
		element.setAttribute('version', 1.1);
		var defs = this.defs = createElement('defs');
		element.appendChild(defs);
		if (width != null && height != null) this.resize(width, height);
	},

	resize: function(width, height){
		var element = this.element;
		element.setAttribute('width', width);
		element.setAttribute('height', height);
		return this;
	},
	
	toElement: function(){
		return this.element;
	}

});

// SVG Element Class

ART.SVG.Element = new Class({
	
	Extends: ART.Element,

	initialize: function(tag){
		this.uid = ART.uniqueID();
		var element = this.element = createElement(tag);
		element.setAttribute('id', 'e' + this.uid);
		this.transform = {translate: [0, 0], rotate: [0, 0, 0], scale: [1, 1]};
	},
	
	/* transforms */
	
	_writeTransform: function(){
		var transforms = [];
		for (var transform in this.transform) transforms.push(transform + '(' + this.transform[transform].join(',') + ')');
		this.element.setAttribute('transform', transforms.join(' '));
	},
	
	rotate: function(deg, x, y){
		if (x == null || y == null){
			var box = this.measure();
			x = box.left + box.width / 2; y = box.top + box.height / 2;
		}
		this.transform.rotate = [deg, x, y];
		this._writeTransform();
		return this;
	},

	scale: function(x, y){
		if (y == null) y = x;
		this.transform.scale = [x, y];
		this._writeTransform();
		return this;
	},

	translate: function(x, y){
		this.transform.translate = [x, y];
		this._writeTransform();
		return this;
	},
	
	setOpacity: function(opacity){
		this.element.setAttribute('opacity', opacity);
		return this;
	},
	
	// visibility
	
	hide: function(){
		this.element.setAttribute('display', 'none');
		return this;
	},
	
	show: function(){
		this.element.setAttribute('display', '');
		return this;
	}
	
});

// SVG Group Class

ART.SVG.Group = new Class({
	
	Extends: ART.SVG.Element,
	Implements: ART.Container,
	
	initialize: function(){
		this.parent('g');
		this.defs = createElement('defs');
		this.element.appendChild(this.defs);
		this.children = [];
	},
	
	measure: function(){
		return ART.Path.measure(this.children.map(function(child){
			return child.currentPath;
		}));
	}
	
});

// SVG Base Shape Class

ART.SVG.Base = new Class({
	
	Extends: ART.SVG.Element,

	initialize: function(tag){
		this.parent(tag);
		this.element.setAttribute('fill-rule', 'evenodd');
		this.fill();
		this.stroke();
	},
	
	/* insertions */
	
	inject: function(container){
		this.eject();
		if (container instanceof ART.SVG.Group) container.children.push(this);
		this.container = container;
		this._injectGradient('fill');
		this._injectGradient('stroke');
		this.parent(container);
		return this;
	},
	
	eject: function(){
		if (this.container){
			if (this.container instanceof ART.SVG.Group) this.container.children.erase(this);
			this.parent();
			this._ejectGradient('fill');
			this._ejectGradient('stroke');
			this.container = null;
		}
		return this;
	},
	
	_injectGradient: function(type){
		if (!this.container) return;
		var gradient = this[type + 'Gradient'];
		if (gradient) this.container.defs.appendChild(gradient);
	},
	
	_ejectGradient: function(type){
		if (!this.container) return;
		var gradient = this[type + 'Gradient'];
		if (gradient) this.container.defs.removeChild(gradient);
	},
	
	/* styles */
	
	_createGradient: function(type, style, stops){
		this._ejectGradient(type);

		var gradient = createElement(style + 'Gradient');

		this[type + 'Gradient'] = gradient;

		var addColor = function(offset, color){
			color = Color.detach(color);
			var stop = createElement('stop');
			stop.setAttribute('offset', offset);
			stop.setAttribute('stop-color', color[0]);
			stop.setAttribute('stop-opacity', color[1]);
			gradient.appendChild(stop);
		};

		// Enumerate stops, assumes offsets are enumerated in order
		// TODO: Sort. Chrome doesn't always enumerate in expected order but requires stops to be specified in order.
		if ('length' in stops) for (var i = 0, l = stops.length - 1; i <= l; i++) addColor(i / l, stops[i]);
		else for (var offset in stops) addColor(offset, stops[offset]);

		var id = 'g' + ART.uniqueID();
		gradient.setAttribute('id', id);

		this._injectGradient(type);

		this.element.removeAttribute('fill-opacity');
		this.element.setAttribute(type, 'url(#' + id + ')');
		
		return gradient;
	},
	
	_setColor: function(type, color){
		this._ejectGradient(type);
		this[type + 'Gradient'] = null;
		var element = this.element;
		if (color == null){
			element.setAttribute(type, 'none');
			element.removeAttribute(type + '-opacity');
		} else {
			color = Color.detach(color);
			element.setAttribute(type, color[0]);
			element.setAttribute(type + '-opacity', color[1]);
		}
	},

	fill: function(color){
		if (arguments.length > 1) this.fillLinear(arguments);
		else this._setColor('fill', color);
		return this;
	},

	fillRadial: function(stops, focusX, focusY, radius, centerX, centerY){
		var gradient = this._createGradient('fill', 'radial', stops);

		if (focusX != null) gradient.setAttribute('fx', focusX);
		if (focusY != null) gradient.setAttribute('fy', focusY);

		if (radius) gradient.setAttribute('r', radius);

		if (centerX == null) centerX = focusX;
		if (centerY == null) centerY = focusY;

		if (centerX != null) gradient.setAttribute('cx', centerX);
		if (centerY != null) gradient.setAttribute('cy', centerY);

		gradient.setAttribute('spreadMethod', 'reflect'); // Closer to the VML gradient
		
		return this;
	},

	fillLinear: function(stops, angle){
		var gradient = this._createGradient('fill', 'linear', stops);

		angle = ((angle == null) ? 270 : angle) * Math.PI / 180;

		var x = Math.cos(angle), y = -Math.sin(angle),
			l = (Math.abs(x) + Math.abs(y)) / 2;

		x *= l; y *= l;

		gradient.setAttribute('x1', 0.5 - x);
		gradient.setAttribute('x2', 0.5 + x);
		gradient.setAttribute('y1', 0.5 - y);
		gradient.setAttribute('y2', 0.5 + y);

		return this;
	},

	stroke: function(color, width, cap, join){
		var element = this.element;
		element.setAttribute('stroke-width', (width != null) ? width : 1);
		element.setAttribute('stroke-linecap', (cap != null) ? cap : 'round');
		element.setAttribute('stroke-linejoin', (join != null) ? join : 'round');

		this._setColor('stroke', color);
		return this;
	}
	
});

// SVG Shape Class

ART.SVG.Shape = new Class({
	
	Extends: ART.SVG.Base,
	
	initialize: function(path){
		this.parent('path');
		if (path != null) this.draw(path);
	},
	
	getPath: function(){
		return this.currentPath || new ART.Path;
	},
	
	draw: function(path){
		this.currentPath = (path instanceof ART.Path) ? path : new ART.Path(path);
		this.element.setAttribute('d', this.currentPath.toSVG());
		return this;
	},
	
	measure: function(){
		return this.getPath().measure();
	}

});

ART.SVG.Image = new Class({
	
	Extends: ART.SVG.Base,
	
	initialize: function(src, width, height){
		this.parent('image');
		if (arguments.length == 3) this.draw.apply(this, arguments);
	},
	
	draw: function(src, width, height){
		var element = this.element;
		element.setAttributeNS(XLINK, 'href', src);
		element.setAttribute('width', width);
		element.setAttribute('height', height);
		return this;
	}
	
});

})();


/*
---
name: ART.VML
description: "VML implementation for ART"
authors: ["[Simo Kinnunen](http://twitter.com/sorccu)", "[Valerio Proietti](http://mad4milk.net)", "[Sebastian Markbåge](http://calyptus.eu/)"]
provides: [ART.VML, ART.VML.Group, ART.VML.Shape]
requires: [ART, ART.Element, ART.Container, ART.Path]
...
*/

(function(){

var precision = 100, UID = 0;

// VML Base Class

ART.VML = new Class({

	Extends: ART.Element,
	Implements: ART.Container,
	
	initialize: function(width, height){
		this.vml = document.createElement('vml');
		this.element = document.createElement('av:group');
		this.vml.appendChild(this.element);
		this.children = [];
		if (width != null && height != null) this.resize(width, height);
	},
	
	inject: function(element){
		if (element.element) element = element.element;
		element.appendChild(this.vml);
	},
	
	resize: function(width, height){
		this.width = width;
		this.height = height;
		var style = this.vml.style;
		style.pixelWidth = width;
		style.pixelHeight = height;
		
		style = this.element.style;
		style.width = width;
		style.height = height;
		
		var halfPixel = (0.5 * precision);
		
		this.element.coordorigin = halfPixel + ',' + halfPixel;
		this.element.coordsize = (width * precision) + ',' + (height * precision);

		this.children.each(function(child){
			child._transform();
		});
		
		return this;
	},
	
	toElement: function(){
		return this.vml;
	}
	
});

// VML Initialization

var VMLCSS = 'behavior:url(#default#VML);display:inline-block;position:absolute;left:0px;top:0px;';

var styleSheet, styledTags = {}, styleTag = function(tag){
	if (styleSheet) styledTags[tag] = styleSheet.addRule('av\\:' + tag, VMLCSS);
};

ART.VML.init = function(document){

	var namespaces = document.namespaces;
	if (!namespaces) return false;

	namespaces.add('av', 'urn:schemas-microsoft-com:vml');
	namespaces.add('ao', 'urn:schemas-microsoft-com:office:office');

	styleSheet = document.createStyleSheet();
	styleSheet.addRule('vml', 'display:inline-block;position:relative;overflow:hidden;');
	styleTag('fill');
	styleTag('stroke');
	styleTag('path');
	styleTag('group');

	return true;

};

// VML Element Class

ART.VML.Element = new Class({
	
	Extends: ART.Element,
	
	initialize: function(tag){
		this.uid = ART.uniqueID();
		if (!(tag in styledTags)) styleTag(tag);

		var element = this.element = document.createElement('av:' + tag);
		element.setAttribute('id', 'e' + this.uid);
		
		this.transform = {translate: [0, 0], scale: [1, 1], rotate: [0, 0, 0]};
	},
	
	/* dom */
	
	inject: function(container){
		this.eject();
		this.container = container;
		container.children.include(this);
		this._transform();
		this.parent(container);
		
		return this;
	},

	eject: function(){
		if (this.container){
			this.container.children.erase(this);
			this.container = null;
			this.parent();
		}
		return this;
	},

	/* transform */

	_transform: function(){
		var l = this.left || 0, t = this.top || 0,
		    w = this.width, h = this.height;
		
		if (w == null || h == null) return;
		
		var tn = this.transform,
			tt = tn.translate,
			ts = tn.scale,
			tr = tn.rotate;

		var cw = w, ch = h,
		    cl = l, ct = t,
		    pl = tt[0], pt = tt[1],
		    rotation = tr[0],
		    rx = tr[1], ry = tr[2];
		
		// rotation offset
		var theta = rotation / 180 * Math.PI,
		    sin = Math.sin(theta), cos = Math.cos(theta);
		
		var dx = w / 2 - rx,
		    dy = h / 2 - ry;
				
		pl -= cos * -(dx + l) + sin * (dy + t) + dx;
		pt -= cos * -(dy + t) - sin * (dx + l) + dy;
 
		// scale
		cw /= ts[0];
		ch /= ts[1];
		cl /= ts[0];
		ct /= ts[1];
 
		// transform into multiplied precision space		
		cw *= precision;
		ch *= precision;
		cl *= precision;
		ct *= precision;

		pl *= precision;
		pt *= precision;
		w *= precision;
		h *= precision;
		
		var element = this.element;
		element.coordorigin = cl + ',' + ct;
		element.coordsize = cw + ',' + ch;
		element.style.left = pl;
		element.style.top = pt;
		element.style.width = w;
		element.style.height = h;
		element.style.rotation = rotation;
	},
	
	// transformations
	
	translate: function(x, y){
		this.transform.translate = [x, y];
		this._transform();
		return this;
	},
	
	scale: function(x, y){
		if (y == null) y = x;
		this.transform.scale = [x, y];
		this._transform();
		return this;
	},
	
	rotate: function(deg, x, y){
		if (x == null || y == null){
			var box = this.measure(precision);
			x = box.left + box.width / 2; y = box.top + box.height / 2;
		}
		this.transform.rotate = [deg, x, y];
		this._transform();
		return this;
	},
	
	// visibility
	
	hide: function(){
		this.element.style.display = 'none';
		return this;
	},
	
	show: function(){
		this.element.style.display = '';
		return this;
	}
	
});

// VML Group Class

ART.VML.Group = new Class({
	
	Extends: ART.VML.Element,
	Implements: ART.Container,
	
	initialize: function(){
		this.parent('group');
		this.children = [];
	},
	
	/* dom */
	
	inject: function(container){
		this.parent(container);
		this.width = container.width;
		this.height = container.height;
		this._transform();
		return this;
	},
	
	eject: function(){
		this.parent();
		this.width = this.height = null;
		return this;
	}

});

// VML Base Shape Class

ART.VML.Base = new Class({

	Extends: ART.VML.Element,
	
	initialize: function(tag){
		this.parent(tag);
		var element = this.element;

		var fill = this.fillElement = document.createElement('av:fill');
		fill.on = false;
		element.appendChild(fill);
		
		var stroke = this.strokeElement = document.createElement('av:stroke');
		stroke.on = false;
		element.appendChild(stroke);
	},
	
	/* styles */

	_createGradient: function(style, stops){
		var fill = this.fillElement;

		// Temporarily eject the fill from the DOM
		this.element.removeChild(fill);

		fill.type = style;
		fill.method = 'none';
		fill.rotate = true;

		var colors = [], color1, color2;

		var addColor = function(offset, color){
			color = Color.detach(color);
			if (color1 == null) color1 = color;
			else color2 = color;
			colors.push(offset + ' ' + color[0]);
		};

		// Enumerate stops, assumes offsets are enumerated in order
		if ('length' in stops) for (var i = 0, l = stops.length - 1; i <= l; i++) addColor(i / l, stops[i]);
		else for (var offset in stops) addColor(offset, stops[offset]);
		
		fill.color = color1[0];
		fill.color2 = color2[0];
		
		//if (fill.colors) fill.colors.value = colors; else
		fill.colors = colors;

		// Opacity order gets flipped when color stops are specified
		fill.opacity = color2[1];
		fill['ao:opacity2'] = color1[1];

		fill.on = true;
		this.element.appendChild(fill);
		return fill;
	},
	
	_setColor: function(type, color){
		var element = this[type + 'Element'];
		if (color == null){
			element.on = false;
		} else {
			color = Color.detach(color);
			element.color = color[0];
			element.opacity = color[1];
			element.on = true;
		}
	},
	
	fill: function(color){
		if (arguments.length > 1){
			this.fillLinear(arguments);
		} else {
			var fill = this.fillElement;
			fill.type = 'solid';
			fill.color2 = '';
			fill['ao:opacity2'] = '';
			if (fill.colors) fill.colors.value = '';
			this._setColor('fill', color);
		}
		return this;
	},

	fillRadial: function(stops, focusX, focusY, radius){
		var fill = this._createGradient('gradientradial', stops);
		fill.focus = 50;
		fill.focussize = '0 0';
		fill.focusposition = (focusX == null ? 0.5 : focusX) + ',' + (focusY == null ? 0.5 : focusY);
		fill.focus = (radius == null || radius > 0.5) ? '100%' : (Math.round(radius * 200) + '%');
		return this;
	},

	fillLinear: function(stops, angle){
		var fill = this._createGradient('gradient', stops);
		fill.focus = '100%';
		fill.angle = (angle == null) ? 0 : (90 + angle) % 360;
		return this;
	},

	/* stroke */
	
	stroke: function(color, width, cap, join){
		var stroke = this.strokeElement;
		stroke.weight = (width != null) ? (width / 2) + 'pt' : 1;
		stroke.endcap = (cap != null) ? ((cap == 'butt') ? 'flat' : cap) : 'round';
		stroke.joinstyle = (join != null) ? join : 'round';

		this._setColor('stroke', color);
		return this;
	}

});

// VML Shape Class

ART.VML.Shape = new Class({

	Extends: ART.VML.Base,
	
	initialize: function(path){
		this.parent('shape');

		var p = this.pathElement = document.createElement('av:path');
		p.gradientshapeok = true;
		this.element.appendChild(p);
		
		if (path != null) this.draw(path);
	},
	
	getPath: function(){
		return this.currentPath;
	},
	
	// SVG to VML
	
	draw: function(path){
		
		this.currentPath = (path instanceof ART.Path) ? path : new ART.Path(path);
		this.currentVML = this.currentPath.toVML(precision);
		var size = this.currentPath.measure(precision);
		
		this.right = size.right;
		this.bottom = size.bottom;
		this.top = size.top;
		this.left = size.left;
		this.height = size.height;
		this.width = size.width;
		
		this._transform();
		this._redraw(this._radial);
		
		return this;
	},
	
	measure: function(){
		return this.getPath().measure();
	},
	
	// radial gradient workaround

	_redraw: function(radial){
		var vml = this.currentVML || '';

		this._radial = radial;
		if (radial){
			var cx = Math.round((this.left + this.width * radial.x) * precision),
				cy = Math.round((this.top + this.height * radial.y) * precision),

				rx = Math.round(this.width * radial.r * precision),
				ry = Math.round(this.height * radial.r * precision),

				arc = ['wa', cx - rx, cy - ry, cx + rx, cy + ry].join(' ');

			vml = [
				// Resolve rendering bug
				'm', cx, cy - ry, 'l', cx, cy - ry,

				// Merge existing path
				vml,

				// Draw an ellipse around the path to force an elliptical gradient on any shape
				'm', cx, cy - ry,
				arc, cx, cy - ry, cx, cy + ry, arc, cx, cy + ry, cx, cy - ry,
				arc, cx, cy - ry, cx, cy + ry, arc, cx, cy + ry, cx, cy - ry,

				// Don't stroke the path with the extra ellipse, redraw the stroked path separately
				'ns e', vml, 'nf'
			
			].join(' ');
		}

		this.element.path = vml + 'e';
	},

	fill: function(){
		this._redraw();
		return this.parent.apply(this, arguments);
	},

	fillLinear: function(){
		this._redraw();
		return this.parent.apply(this, arguments);
	},

	fillRadial: function(stops, focusX, focusY, radius, centerX, centerY){
		this.parent.apply(this, arguments);

		if (focusX == null) focusX = 0.5;
		if (focusY == null) focusY = 0.5;
		if (radius == null) radius = 0.5;
		if (centerX == null) centerX = focusX;
		if (centerY == null) centerY = focusY;
		
		centerX += centerX - focusX;
		centerY += centerY - focusY;
		
		// Compensation not needed when focusposition is applied out of document
		//focusX = (focusX - centerX) / (radius * 4) + 0.5;
		//focusY = (focusY - centerY) / (radius * 4) + 0.5;

		this.fillElement.focus = '50%';
		//this.fillElement.focusposition = focusX + ',' + focusY;

		this._redraw({x: centerX, y: centerY, r: radius * 2});

		return this;
	}

});
	
})();


/*
---
name: ART.Base
description: "Implements ART, ART.Shape and ART.Group based on the current browser."
provides: [ART.Base, ART.Group, ART.Shape]
requires: [ART.VML, ART.SVG]
...
*/

(function(){
	
var SVG = function(){

	var implementation = document.implementation;
	return (implementation && implementation.hasFeature && implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1"));

};

var VML = function(){

	return ART.VML.init(document);

};

var MODE = SVG() ? 'SVG' : VML() ? 'VML' : null;
if (!MODE) return;

ART.Shape = new Class({Extends: ART[MODE].Shape});
ART.Group = new Class({Extends: ART[MODE].Group});
ART.implement({Extends: ART[MODE]});

})();
