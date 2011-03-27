(function(){

var fonts = [], artVar = new AST.Variable('ART'), artFont = artVar.property('Font');

ART.registerFont = function(font){
	fonts.push(artVar.property('registerFont').call(AST.Expression(font)));
};

ART.Script.grabFontExpressions = function(){
	var f = fonts;
	fonts = [];
	return f;
};

ART.Font = ART.Class(ART.Script.Base, {

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
		if (!expr) expr = this.args ? new AST.New(artFont, this.args) : artFont.construct();
		return this.base_toExpression(expr);
	},

	toClass: function(){
		var self = new AST.This(),
			parent = self.property('font_initialize'),
			callParent = this.args ? new AST.Call(parent, this.args) : parent.call(),
			callMethods = this.toExpression(self);

		return classVar.call(artFont, {

			font_initialize: artFont.property('prototype').property('initialize'),

			initialize: new AST.Function(null, null, callMethods === self ? [callParent] : [callParent, callMethods])

		});
	}

});

})();