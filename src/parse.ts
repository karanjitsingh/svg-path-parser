
enum CanvasCommand {
	Move = "moveTo",
	Line = "lineTo",
	BezierCurve = "bezierCurveTo",
	QuadraticCurve = "quadraticCurveTo",
	EllipticalArc = "arc",
	Save = "save",
	Translate = "translate",
	Rotate = "rotate",
	Scale = "scale",
	Restore = "restore",
	ClosePath = "closePath"
}

interface CanvasPathElement {
	f: CanvasCommand,
	args: Array<number>
}

interface Point {
	x: number,
	y: number
}

interface PathCommand {
	command: string,
	args: Array<number>
}

interface CommandSignature {
	toCanvas: (pos:Point, relative: boolean, args: Array<number>, _args?: Array<number>) => Array<CanvasPathElement>,
	canvasCommand: CanvasCommand
	regexPattern: Array<RegexPatterns>
}

enum RegexPatterns {
	Num = 0,
	Flag,
	WS,
	Commands,
}

class SVGPath {
	
	private static Patterns: string[] =  ["(-?(?:[0-9]*)?(?:[.])?[0-9]+)", "([01])", "(?:[,]|[\n \t]*)?", "([MmLlHhVvCcSsQqTtAaZz])"];
	
	private static relToAbs(rel:Point, args: Array<number>) {
		for(var i=0;i<args.length;i++)
			args[i] += i%2==0?rel.x:rel.y;
	}

	private static Signatures:{ [id: string] : CommandSignature; } = {
		// Mm (x y)+
		"M": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>) => {
				var args = args.slice();
				if(relative) SVGPath.relToAbs(pos, args);

				pos.x = args[0];
				pos.y = args[1];
				
				return [<CanvasPathElement> {
					f: CanvasCommand.Move,
					args: args
				}]
			},
			regexPattern: [RegexPatterns.Num, RegexPatterns.Num]
		},
		
		// Ll (x y)+
		"L": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>) => {
				var args = args.slice();
				if(relative) SVGPath.relToAbs(pos, args);

				pos.x = args[0];
				pos.y = args[1];
				
				return [<CanvasPathElement> {
					f: CanvasCommand.Line,
					args: args
				}]
			},
			regexPattern: [RegexPatterns.Num, RegexPatterns.Num]
		},
		// Hh x+
		"H": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>) => {
				var args = args.slice();
				if(relative) args[0] += pos.x;
				args.push(pos.y);

				pos.x = args[0];
				pos.y = pos.y;
				
				return [<CanvasPathElement> {
					f: CanvasCommand.Line,
					args: args
				}]
			},
			regexPattern: [RegexPatterns.Num],
		},
		// Vv y+
		"V": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>) => {
				var args = args.slice();
				args.unshift(pos.x);
				if(relative) args[1] += pos.y

				pos.x = pos.x;
				pos.y = args[1];
				
				return [<CanvasPathElement> {
					f: CanvasCommand.Line,
					args: args
				}]
			},
			regexPattern: [RegexPatterns.Num],
		},
		// Cc (x1 y1 x2 y2 x y)+
		"C": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>) => {
				var args = args.slice();
				if(relative) SVGPath.relToAbs(pos, args);

				pos.x = args[4];
				pos.y = args[5];
				
				return [<CanvasPathElement> {
					f: CanvasCommand.BezierCurve,
					args: args
				}]
			},
			regexPattern: [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],
		},
		// Ss (x2 y2 x y)+
		"S": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>, _args: Array<number>) => {
				var args = args.slice();
				if(relative) SVGPath.relToAbs(pos, args);

				var cp1:Point = {
					x: pos.x,
					y: pos.y
				}

				if(_args) {
					cp1.x = 2 * pos.x - _args[2];
					cp1.y = 2 * pos.y - _args[3];
				}

				args.unshift(cp1.y);
				args.unshift(cp1.x);
				

				pos.x = args[4];
				pos.y = args[5];
				
				return [<CanvasPathElement> {
					f: CanvasCommand.BezierCurve,
					args: args
				}]
			},
			regexPattern: [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],
		},
		// Qq (x1 y1 x y)+
		"Q": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>) => {
				var args = args.slice();
				if(relative) SVGPath.relToAbs(pos, args);

				pos.x = args[2];
				pos.y = args[3];
				
				return [<CanvasPathElement> {
					f: CanvasCommand.QuadraticCurve,
					args: args
				}]
			},
			regexPattern: [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],
		},
		// Tt (x y)+
		"T": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>, _args: Array<number>) => {
				var args = args.slice();
				if(relative) SVGPath.relToAbs(pos, args);
				
				var cp1:Point = {
					x: pos.x,
					y: pos.y
				}

				if(_args) {
					cp1.x = 2 * pos.x - _args[0];
					cp1.y = 2 * pos.y - _args[1];
				}

				args.unshift(cp1.y);
				args.unshift(cp1.x);

				pos.x = args[2];
				pos.y = args[3];
				
				return [<CanvasPathElement> {
					f: CanvasCommand.QuadraticCurve,
					args: args
				}]
			},
			regexPattern: [RegexPatterns.Num, RegexPatterns.Num],
		},
		// Aa (r.x r.y x-axis-rotation large-arc-flag sweep-flag x y)+
		"A": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>) => {
				var args = args.slice();
				if(relative) {
					args[5] += pos.x;
					args[6] += pos.y;
				}

				var pathElements: Array<CanvasPathElement> = SVGPath.parseEllipticalArc(
					pos,
					{x: args[0], y:args[1]},
					args[2],
					args[3],
					args[4],
					{
						x:args[5],
						y:args[6]
					}
				);

				pos.x = args[5];
				pos.y = args[6];
				
				return pathElements;
			},
			regexPattern: [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Flag, RegexPatterns.Flag, RegexPatterns.Num, RegexPatterns.Num],
		},
		// Zz
		"Z": <CommandSignature>{
			toCanvas: (pos: Point, relative: boolean, args: Array<number>) => {
				var args = args.slice();
				
				var canvasCommand = CanvasCommand.ClosePath;
				return null;
			},
			regexPattern: []
		},
	};
	
	public paths: Array<CanvasPathElement>;
	public parseError: boolean;
	
	constructor(d: string) {
		this.paths = [];
		this.parseError = false;
		this.paths = this.ParsePath2D(d);
	}
	
	private ParsePath2D(d: string): Array<CanvasPathElement> {
		
		var match: RegExpMatchArray;
		var commandList: Array<PathCommand> = [];
		var pathList: Array<CanvasPathElement> = []
		
		var matchPattern = function (p: RegexPatterns, flags?:string) {
			var m;
			
			if((m = d.match(new RegExp("^" + SVGPath.Patterns[p], flags))) !== null) {
				d = d.substr(m[0].length);
				parserPos += m[0].length;
				match = m;
			}
			else if((m = d.match(new RegExp("^" + SVGPath.Patterns[RegexPatterns.Num], flags))) !== null) {
				match = [commandList[commandList.length-1].command];
			}
			else 
				match = null;
				
			return match !== null;
		};

		var p = "";
		var parserPos = 0;

		var ctxPos: Point = {
			x: 0,
			y: 0
		}

		while(d.length > 0) {
			matchPattern(RegexPatterns.WS);
			
			if(matchPattern(RegexPatterns.Commands)) {
				var cmd = match[0];
				var relative = cmd.toLowerCase() === cmd;
				var signature = SVGPath.Signatures[cmd.toUpperCase()];
				var pattern = signature.regexPattern;
				var _args: Array<number> = null;

				p += " " + cmd;

				var svgCmd: PathCommand = {
					command: match[0],
					args: [],
				}

				var canvasCmd: CanvasPathElement = {
					f: signature.canvasCommand,
					args: []
				}

				for(var i=0;i<pattern.length;i++) {
					matchPattern(RegexPatterns.WS);
					if(matchPattern(pattern[i])){
						svgCmd.args.push(pattern[i] === RegexPatterns.Num ? parseFloat(match[0]) : parseInt(match[0]));
					}
					else {
						this.parseError = true;
						console.error("Error parsing svg path at " + parserPos);
						return pathList;
					}
				}

				p += " " + svgCmd.args.join(" ");

				if(pathList.length > 1 && ((cmd.toUpperCase() == "S" && "cCsS".indexOf(commandList[commandList.length-1].command) !== -1) || (cmd.toUpperCase() == "T" && "qQtT".indexOf(commandList[commandList.length-1].command) !== -1))) {
					_args = pathList[pathList.length-1].args;
				}

				commandList.push(svgCmd);
				pathList.push.apply(pathList,signature.toCanvas(ctxPos,relative,svgCmd.args, _args));
			}
			else if(d.length > 0) {
				this.parseError = true;
				console.error("Error parsing svg path at " + parserPos);
				break;
			}
			
		}
		
		console.log(p);
		return pathList;
	}
	
	private static parseEllipticalArc(x1: Point, r:Point , phi: number, fA: number, fS: number, x2: Point): Array<CanvasPathElement> {
		
		function mag(v: Point) {
			return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
		}
		
		function dot(u: Point, v: Point) {
			return (u.x*v.x + u.y*v.y);
		}
		
		function ratio(u: Point, v: Point) {
			return dot(u,v) / (mag(u)*mag(v))
		}
		
		function clamp(value, min, max) {
			return Math.min(Math.max(value, min),max);
		}
		
		function angle(u: Point, v: Point) {
			var sign = 1.0;
			if ((u.x*v.y - u.y*v.x) < 0) {
				sign = -1.0;
			}
			return sign * Math.acos(clamp(ratio(u,v), -1, 1));
		}
		
		function rotClockwise(v: Point, angle): Point {
			var cost = Math.cos(angle);
			var sint = Math.sin(angle);
			return {x: cost*v.x + sint*v.y, y:-1 * sint*v.x + cost*v.y};
		}
		
		function rotCounterClockwise(v: Point, angle): Point {
			var cost = Math.cos(angle);
			var sint = Math.sin(angle);
			return {x:cost*v.x - sint*v.y, y:sint*v.x + cost*v.y};
		}
		
		function midPoint(u: Point, v: Point): Point {
			return {x:(u.x - v.x)/2.0, y:(u.y - v.y)/2.0};
		}
		
		function meanVec(u: Point, v: Point): Point {
			return {x:(u.x + v.x)/2.0, y:(u.y + v.y)/2.0};
		}
		
		function pointMul(u: Point, v: Point): Point {
			return {x:u.x*v.x, y:u.y*v.y};
		}
		
		function scale(c, v: Point): Point {
			return {x:c*v.x, y:c*v.y};
		}
		
		function sum(u: Point, v: Point): Point {
			return {x:u.x + v.x, y: u.y + v.y};
		}
		
		// Convert from endpoint to center parametrization, as detailed in:
		//   http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
		if (r.x == 0 || r.y == 0) {
			return[{f: CanvasCommand.Line, args: [x2.x, x2.y]}];
		}
		var phi = phi * (Math.PI / 180.0);
		r.x = Math.abs(r.x);
		r.y = Math.abs(r.y);
		var xPrime = rotClockwise(midPoint(x1, x2), phi);				// F.6.5.1
		var xPrime2 = pointMul(xPrime, xPrime);
		var r2 = {x:Math.pow(r.x, 2), y: Math.pow(r.y, 2)};
		
		var lambda = Math.sqrt(xPrime2.x/r2.x + xPrime2.y/r2.y);
		if (lambda > 1) {
			r.x *= lambda;
			r.y *= lambda;
			r2.x = Math.pow(r.x, 2);
			r2.y = Math.pow(r.y, 2);
		}
		
		var factor = Math.sqrt(Math.abs(r2.x*r2.y - r2.x*xPrime2.y - r2.y*xPrime2.x) / (r2.x*xPrime2.y + r2.y*xPrime2.x));
		
		if (fA == fS) {
			factor *= -1.0;
		}
		
		var cPrime = scale(factor, {x: r.x*xPrime.y/r.y, y: -r.y*xPrime.x/r.x});					// F.6.5.2
		var c = sum(rotCounterClockwise(cPrime, phi), meanVec(x1, x2));								// F.6.5.3
		var x1UnitVector = {x: (xPrime.x - cPrime.x)/r.x, y:(xPrime.y - cPrime.y)/r.y};
		var x2UnitVector = {x:(-1.0*xPrime.x - cPrime.x)/r.x, y:(-1.0*xPrime.y - cPrime.y)/r.y};
		var theta = angle({x:1, y:0}, x1UnitVector);												// F.6.5.5
		var deltaTheta = angle(x1UnitVector, x2UnitVector);											// F.6.5.6
		var start = theta;
		var end = theta+deltaTheta;
		
		return [
			{f: CanvasCommand.Save, args: []},
			{f: CanvasCommand.Translate, args: [c.x, c.y]},
			{f: CanvasCommand.Rotate, args: [phi]},
			{f: CanvasCommand.Scale, args: [r.x, r.y]},
			{f: CanvasCommand.EllipticalArc, args: [0, 0, 1, start, end, 1-fS]},
			{f: CanvasCommand.Restore, args: []}
		];
	}
	
	public draw(ctx: CanvasRenderingContext2D) {
		for(var i =0;i<this.paths.length; i++) {
			ctx[this.paths[i].f].apply(ctx,this.paths[i].args);
		}
	}
	
}
