(function(){

var fonts = [], artVar = new AST.Variable('ART');

ART.registerFont = function(font){
	fonts.push(new AST.Call(artVar.property('registerFont'), AST.Expression(font)));
};

ART.Script.grabFontExpressions = function(){
	var f = fonts;
	fonts = [];
	return f;
};

})();