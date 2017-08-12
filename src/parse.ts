
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

interface PathElement {
	f: CanvasCommand,
	args: Array<number>
}

interface Point {
	x: number,
	y: number
}

interface PathCommand {
	command: string,
	regex: string
}

function ParsePath2D(paths: string) {

	console.log(paths);

	const enum RegexPatterns {
		Num = 0,
		Flag,
		WS,
		Commands,
	}

	var Patterns = ["(-?(?:[0-9]*)?(?:[.])?[0-9]+)", "([01])", "(?:[,]|[\n \t]*)?", "([MmLlHhVvCcSsQqTtAa])"];

	var regStrings = {
		// Mm (x y)+
		"M": [RegexPatterns.Num, RegexPatterns.Num],

		// Ll (x y)+
		"L": [RegexPatterns.Num, RegexPatterns.Num],

		// Hh x+
		"H": [RegexPatterns.Num],

		// Vv y+
		"V": [RegexPatterns.Num],

		// Cc (x1 y1 x2 y2 x y)+
		"C": [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],

		// Ss (x2 y2 x y)+
		"S": [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],

		// Qq (x1 y1 x y)+
		"Q": [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],

		// Tt (x y)+
		"T": [RegexPatterns.Num, RegexPatterns.Num],

		// Aa (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+
		"A": [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Flag, RegexPatterns.Flag, RegexPatterns.Num, RegexPatterns.Num],
	};

	// var getCommandRegex = function(command) {
	// 	var regex = "^" + Patterns.ws + "([" + command + command.toLowerCase() + "])" + Patterns.ws + regStrings[command];
	// 	console.log(regex);
	// 	return new RegExp(regex, "m");
	// }

	// var i;
	// for(i in regStrings) {
	// 	var regex = getCommandRegex(i);
	// 	console.log(paths.match(regex))
	// }
	
	
}

class SVGParser {
	
	private paths: Array<PathElement> = [];

	public SVGParser(path2D: string) {
		this.ParsePath2D(path2D);
	}

	private ParsePath2D(paths: string) {

		console.log(paths);

		var Patterns = {
			num: "(-?[[0-9]*.]?[0-9]+)",
			flag: "([01])",
			ws: "[[,]|[[\\n \\t]*]]?",
		};


		var regStrings = {
			// Mm (x y)+
			"M": Patterns.num + Patterns.ws + Patterns.num,

			// Ll (x y)+
			"L": Patterns.num + Patterns.ws + Patterns.num,

			// Hh x+
			"H": Patterns.num,

			// Vv y+
			"V": Patterns.num,

			// Cc (x1 y1 x2 y2 x y)+
			"C": Patterns.num + Patterns.ws + Patterns.num + Patterns.ws + Patterns.num ,

			// Ss (x2 y2 x y)+
			"S": Patterns.num + Patterns.ws + Patterns.num + Patterns.ws + Patterns.num,
			
			// Qq (x1 y1 x y)+
			"Q": Patterns.num + Patterns.ws + Patterns.num + Patterns.ws + Patterns.num,

			// Tt (x y)+
			"T": Patterns.num + Patterns.ws + Patterns.num,

			// Aa (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+
			"A": Patterns.num + Patterns.ws + Patterns.num + Patterns.ws + Patterns.num + Patterns.ws + Patterns.flag + Patterns.ws + Patterns.flag + Patterns.ws + Patterns.num + Patterns.ws + Patterns.num
		};

		


		
	}

	private parseEllipticalArc(x1: Point, rx: number, ry: number, phi: number, fA: number, fS: number, x2: Point) {

		function mag(v) {
			return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
		}

		function dot(u, v) {
			return (u[0]*v[0] + u[1]*v[1]);
		}

		function ratio(u, v) {
			return dot(u,v) / (mag(u)*mag(v))
		}

		function clamp(value, min, max) {
			return Math.min(Math.max(value, min),max);
		}

		function angle(u, v) {
			var sign = 1.0;
			if ((u[0]*v[1] - u[1]*v[0]) < 0) {
				sign = -1.0;
			}
			return sign * Math.acos(clamp(ratio(u,v), -1, 1));
		}

		function rotClockwise(v, angle) {
			var cost = Math.cos(angle);
			var sint = Math.sin(angle);
			return [cost*v[0] + sint*v[1], -1 * sint*v[0] + cost*v[1]];
		}

		function rotCounterClockwise(v, angle) {
			var cost = Math.cos(angle);
			var sint = Math.sin(angle);
			return [cost*v[0] - sint*v[1], sint*v[0] + cost*v[1]];
		}

		function midPoint(u, v) {
			return [(u[0] - v[0])/2.0, (u[1] - v[1])/2.0];
		}

		function meanVec(u, v) {
			return [(u[0] + v[0])/2.0, (u[1] + v[1])/2.0];
		}

		function pointMul(u, v) {
			return [u[0]*v[0], u[1]*v[1]];
		}

		function scale(c, v) {
			return [c*v[0], c*v[1]];
		}

		function sum(u, v) {
			return [u[0] + v[0], u[1] + v[1]];
		}

		// Convert from endpoint to center parametrization, as detailed in:
		//   http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
		if (rx == 0 || ry == 0) {
			this.paths.push({f: CanvasCommand.Line, args: [x2.x, x2.y]});
			return;
		}
		var phi = phi * (Math.PI / 180.0);
		rx = Math.abs(rx);
		ry = Math.abs(ry);
		var xPrime = rotClockwise(midPoint(x1, x2), phi);				// F.6.5.1
		var xPrime2 = pointMul(xPrime, xPrime);
		var rx2 = Math.pow(rx, 2);
		var ry2 = Math.pow(ry, 2);

		var lambda = Math.sqrt(xPrime2[0]/rx2 + xPrime2[1]/ry2);
		if (lambda > 1) {
			rx *= lambda;
			ry *= lambda;
			rx2 = Math.pow(rx, 2);
			ry2 = Math.pow(ry, 2);
		}

		var factor = Math.sqrt(Math.abs(rx2*ry2 - rx2*xPrime2[1] - ry2*xPrime2[0]) / (rx2*xPrime2[1] + ry2*xPrime2[0]));
		
		if (fA == fS) {
			factor *= -1.0;
		}

		var cPrime = scale(factor, [rx*xPrime[1]/ry, -ry*xPrime[0]/rx]);						// F.6.5.2
		var c = sum(rotCounterClockwise(cPrime, phi), meanVec(x1, x2));							// F.6.5.3
		var x1UnitVector = [(xPrime[0] - cPrime[0])/rx, (xPrime[1] - cPrime[1])/ry];
		var x2UnitVector = [(-1.0*xPrime[0] - cPrime[0])/rx, (-1.0*xPrime[1] - cPrime[1])/ry];
		var theta = angle([1, 0], x1UnitVector);												// F.6.5.5
		var deltaTheta = angle(x1UnitVector, x2UnitVector);										// F.6.5.6
		var start = theta;
		var end = theta+deltaTheta;

		this.paths.push(
			{f: CanvasCommand.Save, args: []},
			{f: CanvasCommand.Translate, args: [c[0], c[1]]},
			{f: CanvasCommand.Rotate, args: [phi]},
			{f: CanvasCommand.Scale, args: [rx, ry]},
			{f: CanvasCommand.EllipticalArc, args: [0, 0, 1, start, end, 1-fS]},
			{f: CanvasCommand.Restore, args: []}
		);
	}

	public draw(ctx: CanvasRenderingContext2D) {

	}

}
