/*
---
name: ART.Script
description: "ART Script stubs for ART"
provides: [ART.Script, ART.Script.Group, ART.Script.Shape]
requires: [ART, ART.Element, ART.Container, ART.Color, ART.Transform, ART.Path]
...
*/

(function(){

// Global AST Variables

var artVar = new AST.Variable('ART'),
	classVar = artVar.property('Class'),
	artShape = artVar.property('Shape'),
	artGroup = artVar.property('Group'),
	artImage = artVar.property('Image'),
	artText = artVar.property('Text');
	
ART.Color.prototype.toExpression = ART.Color.prototype.toHEX;

// ART Script Base Class

ART.Script = ART.Class(ART.Element, ART.Container, {

	initialize: function(width, height){
		this.resize(width, height);
		this.children = [];
	},

	resize: function(width, height){
		this.width = width;
		this.height = height;
		return this;
	},

	toExpression: function(){
		var expr = artVar.construct(this.width, this.height);
		if (!this.children.length) return expr;
		return new AST.Call(expr.property('grab'), this.children);
	},

	toClass: function(){
		var self = new AST.This(),
			callParent = self.property('art_initialize').call(this.width, this.height);

		return classVar.call(artVar, {
		
			art_initialize: artVar.property('prototype').property('initialize'),

			initialize: new AST.Function(null, null, this.children.length ? [callParent, new AST.Call(self.property('grab'), this.children)] : [callParent])

		});
	}

});

// ART Script Element Class

ART.Script.Element = ART.Class(ART.Element, ART.Transform, {

	initialize: function(){
		this._calls = [];
	},

	_addCall: function(property, args){
		this._calls.push({ prop: property, args: Array.prototype.slice.call(args) });
		return this;
	},
	
	toExpression: function(expr){
		var calls = this._calls;
		for (var i = 0, l = calls.length; i < l; i++){
			var call = calls[i];
			expr = new AST.Call(expr.property(call.prop), call.args);
		}
		if (this.xx != 1 || this.xy != 0 || this.yx != 0 || this.yy != 1){
			expr = new AST.Call(expr.property('transform'), (this.x != 0 || this.y != 0) ? [
				this.xx, this.xy,
				this.yx, this.yy,
				this.x, this.y
			] : [
				this.xx, this.xy,
				this.yx, this.yy
			]);
		} else if (this.x != 0 || this.y != 0){
			expr = expr.property('move').call(this.x, this.y);
		}
		return expr;
	},

	// insertions
	
	inject: function(container){
		this.eject();
		if (container.children) container.children.push(this);
		this.container = container;
		return this;
	},
	
	eject: function(){
		if (this.container && this.container.children) this.container.children.erase(this);
		this.container = null;
		return this;
	},
	
	// transforms
	
	blend: function(opacity){ return this._addCall('blend', arguments); },

	// visibility
	
	hide: function(){ return this._addCall('hide', arguments); },
	
	show: function(){ return this._addCall('show', arguments); },
	
	// interaction
	
	indicate: function(){ return this._addCall('indicate', arguments); },
	
	// ignore
	
	listen: function(){
		return this;
	},
	
	ignore: function(){
		return this;
	}
	
});

// ART Script Group Class

ART.Script.Group = ART.Class(ART.Script.Element, ART.Container, {

	element_initialize: ART.Script.Element.prototype.initialize,

	initialize: function(){
		this.element_initialize();
		this.children = [];
	},

	measure: function(){
		return ART.Path.measure(this.children.map(function(child){
			return child.currentPath;
		}));
	},

	element_toExpression: ART.Script.Element.prototype.toExpression,

	toExpression: function(){
		var grab = artGroup.construct().property('grab'),
			children = this.children.map(function(child){ return child.toExpression(); });
		return this.element_toExpression(new AST.Call(grab, children));
	},

	toClass: function(){
		var self = new AST.This(),
			callParent = self.property('group_initialize').call();

		return classVar.call(artGroup, {

			group_initialize: artGroup.property('prototype').property('initialize'),

			initialize: new AST.Function(null, null, this.children.length ? [callParent, new AST.Call(self.property('grab'), this.children)] : [callParent])

		});
	}

});

// ART Script Base Shape Class

ART.Script.Base = ART.Class(ART.Script.Element, {

	/* styles */
	
	fill: function(color){ return this._addCall('fill', arguments); },

	fillRadial: function(stops, focusX, focusY, radius, centerX, centerY){ return this._addCall('fillRadial', arguments); },

	fillLinear: function(stops, angle){
		if (angle == null) return this._addCall('fill', stops);
		return this._addCall('fillLinear', arguments);
	},

	fillImage: function(){ return this._addCall('fillImage', arguments); },

	stroke: function(color, width, cap, join){ return this._addCall('stroke', arguments); }	
	
});

// ART Script Shape Class

ART.Script.Shape = ART.Class(ART.Script.Base, {

	base_initialize: ART.Script.Base.prototype.initialize,
	
	initialize: function(path){
		this.base_initialize();
		if (path != null) this.draw(path);
	},
	
	draw: function(path, width, height){
		path = ((path instanceof ART.Path) ? path : new ART.Path(path)).toString()
		this.args = arguments.length < 3 ? [ path ] : [ path, width, height ];
		return this;
	},
	
	base_toExpression: ART.Script.Base.prototype.toExpression,

	toExpression: function(expr){
		if (!expr) expr = this.args ? new AST.New(artShape, this.args) : artShape.construct();
		return this.base_toExpression(expr);
	},

	toClass: function(){
		var self = new AST.This(),
			parent = self.property('shape_initialize'),
			callParent = this.args ? new AST.Call(parent, this.args) : parent.call(),
			callMethods = this.toExpression(self);

		return classVar.call(artShape, {

			shape_initialize: artShape.property('prototype').property('initialize'),

			initialize: new AST.Function(null, null, callMethods === self ? [callParent] : [callParent, callMethods])

		});
	}

});

// ART Script Image Class

ART.Script.Image = ART.Class(ART.Script.Base, {

	base_initialize: ART.Script.Base.prototype.initialize,
	
	initialize: function(src, width, height){
		this.base_initialize();
		if (src != null) this.draw.apply(this, arguments);
	},
	
	draw: function(){
		this.args = Array.prototype.slice.call(arguments);
		return this;
	},
	
	base_toExpression: ART.Script.Base.prototype.toExpression,

	toExpression: function(expr){
		if (!expr) expr = this.args ? new AST.New(artImage, this.args) : artImage.construct();
		return this.base_toExpression(expr);
	},

	toClass: function(){
		var self = new AST.This(),
			parent = self.property('image_initialize'),
			callParent = this.args ? new AST.Call(parent, this.args) : parent.call(),
			callMethods = this.toExpression(self);

		return classVar.call(artImage, {

			image_initialize: artImage.property('prototype').property('initialize'),

			initialize: new AST.Function(null, null, callMethods === self ? [callParent] : [callParent, callMethods])

		});
	}

});

// ART Script Text Class

ART.Script.Text = ART.Class(ART.Script.Base, {

	base_initialize: ART.Script.Base.prototype.initialize,
	
	initialize: function(text){
		this.base_initialize();
		if (text != null) this.draw.apply(this, arguments);
	},
	
	draw: function(){
		this.args = Array.prototype.slice.call(arguments);
		return this;
	},
	
	base_toExpression: ART.Script.Base.prototype.toExpression,

	toExpression: function(expr){
		if (!expr) expr = this.args ? new AST.New(artText, this.args) : artText.construct();
		return this.base_toExpression(expr);
	},

	toClass: function(){
		var self = new AST.This(),
			parent = self.property('text_initialize'),
			callParent = this.args ? new AST.Call(parent, this.args) : parent.call(),
			callMethods = this.toExpression(self);

		return classVar.call(artText, {

			text_initialize: artText.property('prototype').property('initialize'),

			initialize: new AST.Function(null, null, callMethods === self ? [callParent] : [callParent, callMethods])

		});
	}

});

})();
