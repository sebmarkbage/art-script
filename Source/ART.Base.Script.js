// This is silly, we need a way to select output mode. Even for inherited types.

ART.Shape = new Class({Extends: ART.Script.Shape});
ART.Group = new Class({Extends: ART.Script.Group});
ART.implement({Extends: ART.Script});
