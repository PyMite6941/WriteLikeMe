var module = { exports: {} };
var exports = module.exports;

var DEFAULT_STYLE_CATEGORIES = {
  formality: 0.5,
  complexity: 0.5,
  sentence_length: 0.5,
  vocabulary: 0.5,
  tone: 0.5,
  creativity: 0.5
};

// Generate SVG circles for writing style - simplified version
exports.generateStyleSVG = function(cats, w, h) {
  var opts = { ...DEFAULT_STYLE_CATEGORIES, ...(cats || {}) };
  var SW = w || 400;
  var SH = h || 400;
  var CX = SW / 2;
  var SHalf = SH / 2;
  var MR = Math.min(SW, SH) * 0.35;
  var SP = MR * 0.2;
  var POS = {
    formality: {x:0,y:-1},
    complexity:{x:0.866,y:0.5},
    sentence_length:{x:-0.866,y:0.5},
    vocabulary:{x:-1,y:0},
    tone:{x:0.866,y:-0.5},
    creativity:{x:-0.866,y:-0.5}
  };
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+SW+'" height="'+SH+'" viewBox="0 0 '+SW+' '+SH+'">';
  svg += '<rect width="100%" height="100%" fill="#ffffff"/>';
  svg += '<text x="20" y="30" font-family="Arial" font-size="14" fill="#333">WriteLikeMe Writing Style</text>';
  var CO = ['formality','complexity','sentence_length','vocabulary','tone','creativity'];
  CO.forEach(function(C,idx) {
    var w = opts[C]||0.5;
    var p = POS[C];
    if(!p) return;
    var CR = 8 + (w*14);
    var A = (idx*60-90)*Math.PI/180;
    var CXi = CX + Math.cos(A)*(MR+SP);
    var CYi = SHalf + Math.sin(A)*(MR+SP);
    var H = 140 - (w*80);
    var Ccol = 'hsla('+H+', 70%, 50%, 0.8)';
    var L = C.charAt(0).toUpperCase()+C.slice(1)+': '+Math.round(w*100)+'%';
    svg += '<circle cx="'+CXi+'" cy="'+CYi+'" r="'+CR+'" fill="'+Ccol+'" stroke="#ffffff" stroke-width="2"/>';
    svg += '<text x="'+CXi+'" y="'+(CYi+25)+'" text-anchor="middle" font-family="Arial" font-size="10" fill="#333">'+L+'</text>';
  });
  svg += '<text x="'+CX+'" y="'+(SH-10)+'" text-anchor="middle" font-family="Arial" font-size="11" fill="#666">Export SVG to any AI</text>';
  svg += '</svg>';
  return svg;
};

// Analyze text writing style - simplified
exports.analyzeText = function(t) {
  if(!t||typeof t!=='string')return{...DEFAULT_STYLE_CATEGORIES,confidence:0,wordCount:0,charCount:0};
  var s=t.trim();
  if(s.length===0)return{...DEFAULT_STYLE_CATEGORIES,confidence:0,wordCount:0,charCount:0};
  var L=s.split('\n').filter(function(l){return l.trim().length>0});
  if(L.length===0)return{...DEFAULT_STYLE_CATEGORIES,confidence:0,wordCount:0,charCount:0};
  var TW=L.reduce(function(a,b){var W=b.split(/\s+/).filter(function(w){return w.length>0});return a+W.length;},0);
  var FC=0,EWC=0;
  var FW=['therefore','hence','consequently','furthermore','nevertheless','Moreover','However','Nevertheless'];
  var EI=['!','wow','amazing','fantastic','love','hate','excited','delighted'];
  L.forEach(function(li){
    var wds=L.split(/\s+/).filter(function(w){return w.length>0});
    FW.forEach(function(f){if(li.toLowerCase().includes(f))FC++});
    EI.forEach(function(i){if(li.toLowerCase().includes(i))EWC++});
  });
  var F=Math.min(1,Math.max(0,(FC/Math.max(1,TW))*3);
  var C=Math.min(1,Math.max(0,(TW-Math.min(TW,50)/Math.max(1,TW))*4);
  var Conf=Math.min(1,TW/200);
  return {formality:Math.round(F*100)/100,complexity:Math.round(C*100)/100,sentence_length:Math.round(0.5*100)/100,vocabulary:Math.round(0.5*100)/100,tone:Math.round(0.5*100)/100,creativity:Math.round(0.5*100)/100,confidence:Math.round(Conf*100)/100,wordCount:TW,charCount:s.length};
};

exports.DEFAULT_STYLE_CATEGORIES=DEFAULT_STYLE_CATEGORIES;
module.exports=exports;
