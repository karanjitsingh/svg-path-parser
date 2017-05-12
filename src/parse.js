function isNumber(n) {
	return String(parseFloat(n)) === n;
}

var parser = {
	doMagic: function (ctx, path) {
		ctx.save();
		ctx.beginPath();

		var x = 0, y = 0;

		path = path.split(',').join(' ').split('\n').join(' ').split(' ');

		function getNextPoint() { return parseFloat(path.shift()); }
		function getNextFlag() { return parseInt(path.shift()); }
		function drawEllipticalArc(rx, ry, phi, flagA, flagS, x1, y1, x2, y2) {

			function clamp(value, min, max) {
				Math.min(Math.max(value, min), max)
			}

			function svgAngle(ux, uy, vx, vy ) {
				var dot = ux*vx + uy*vy;
				var len = Math.sqrt(ux*ux + uy*uy) * Math.sqrt(vx*vx + vy*vy);



				var ang = Math.acos( clamp(dot / len,-1,1) );
				if ( (ux*vy - uy*vx) < 0)
					ang = -ang;
				return ang;
			}

			var rX = Math.abs(rx);
			var rY = Math.abs(ry);

			var dx2 = (x1 - x2)/2;
			var dy2 = (y1 - y2)/2;

			var x1p =  Math.cos(phi)*dx2 + Math.sin(phi)*dy2;
			var y1p = -Math.sin(phi)*dx2 + Math.cos(phi)*dy2;

			var rxs = rX * rX;
			var rys = rY * rY;
			var x1ps = x1p * x1p;
			var y1ps = y1p * y1p;

			var cr = x1ps/rxs + y1ps/rys;
			if (cr > 1) {
				var s = Math.sqrt(cr);
				rX = s * rX;
				rY = s * rY;
				rxs = rX * rX;
				rys = rY * rY;
			}

			var dq = (rxs * y1ps + rys * x1ps);
			var pq = (rxs*rys - dq) / dq;
			var q = Math.sqrt( Math.max(0,pq) );
			if (flagA === flagS)
				q = -q;
			var cxp = q * rX * y1p / rY;
			var cyp = - q * rY * x1p / rX;

			var cx = Math.cos(phi)*cxp - Math.sin(phi)*cyp + (x1 + x2)/2;
			var cy = Math.sin(phi)*cxp + Math.cos(phi)*cyp + (y1 + y2)/2;

			var theta = svgAngle( 1,0, (x1p-cxp) / rX, (y1p - cyp)/rY );

			var delta = svgAngle(
				(x1p - cxp)/rX, (y1p - cyp)/rY,
				(-x1p - cxp)/rX, (-y1p-cyp)/rY);

			delta = delta - Math.PI * 2 * Math.floor(delta / (Math.PI * 2));

			if (!flagS)
				delta -= 2 * Math.PI;

			// r_ = float2((float)rX,(float)rY);
			// c = float2((float)cx,(float)cy);
			// angles = float2((float)theta, (float)delta);
		}

		var command = '', symbol, prevCommand = '';

		while (path.length) {
			symbol = path.shift();

			if (symbol === '')
				continue;

			if (!isNumber(symbol)) {
				if (symbol.length > 1)
					path.unshift(symbol.substr(1));
				prevCommand = command;
				command = symbol[0];
			}
			else
				path.unshift(symbol);

			var rx, ry, x1, y1, cpx1, cpx2, cpy1, cpy2, m, c, fa, fs, phi;
			rx = ry = 0;
			if (command.toLowerCase() === command) {
				rx = x;
				ry = y;
			}

			switch (command) {
				case 'm':
				case 'M':
					x = getNextPoint() + rx;
					y = getNextPoint() + ry;
					ctx.moveTo(x, y);
					break;
				case 'l':
				case 'L':
					x1 = getNextPoint() + rx;
					y1 = getNextPoint() + ry;
					ctx.lineTo(x1, y1);
					x = x1;
					y = y1;
					break;
				case 'h':
				case 'H':
					x1 = getNextPoint() + rx;
					ctx.lineTo(x1, y);
					x = x1;
					break;
				case 'v':
				case 'V':
					y1 = getNextPoint() + ry;
					ctx.lineTo(x, y1);
					y = y1;
					break;
				case 'c':
				case 'C':
					cpx1 = getNextPoint() + rx;
					cpy1 = getNextPoint() + ry;

					cpx2 = getNextPoint() + rx;
					cpy2 = getNextPoint() + ry;

					x1 = getNextPoint() + rx;
					y1 = getNextPoint() + ry;

					ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x1, y1);

					x = x1;
					y = y1;
					break;
				case 's':
				case 'S':
					if (prevCommand === 's' || prevCommand === 'S' || prevCommand === 'C' || prevCommand === 'c') {
						//Reflection of previous control point
						cpx1 = 2 * (x) - cpx2;
						cpy1 = 2 * (y) - cpy2;
					}
					else {
						//Assume cp1 to be coincident with current point
						cpx1 = x;
						cpy1 = y;
					}

					cpx2 = getNextPoint() + rx;
					cpy2 = getNextPoint() + ry;

					x1 = getNextPoint() + rx;
					y1 = getNextPoint() + ry;

					ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x1, y1);

					x = x1;
					y = y1;

					break;
				case 'q':
				case 'Q':
					cpx1 = getNextPoint() + rx;
					cpy1 = getNextPoint() + ry;

					x1 = getNextPoint() + rx;
					y1 = getNextPoint() + ry;

					ctx.quadraticCurveTo(cpx1, cpy1, x1, y1);

					x = x1;
					y = y1;
					break;
				case 't':
				case 'T':
					if (prevCommand === 'T' || prevCommand === 't' || prevCommand === 'Q' || prevCommand === 'q') {
						//Reflection of previous control point
						cpx1 = 2 * (x) - cpx1;
						cpy1 = 2 * (y) - cpy1;
					}
					else {
						//Assume cp1 to be coincident with current point
						cpx1 = x;
						cpy1 = y;
					}

					x1 = getNextPoint() + rx;
					y1 = getNextPoint() + ry;

					ctx.quadraticCurveTo(cpx1, cpy1, x1, y1);

					x = x1;
					y = y1;

					break;
				case 'a':
				case 'A':
					cpx1 = getNextPoint();
					cpy1 = getNextPoint();
					phi = getNextPoint();
					fa = getNextFlag();
					fs = getNextFlag();
					x1 = getNextPoint() + rx;
					y1 = getNextPoint() + ry;

					drawEllipticalArc(cpx1, cpy1, phi, fa, fs, x, y, x1, y1);
					
					ctx.x = x1;
					y = y1;
					break;
				case 'z':
				case 'Z':
					console.log("DONE!");
					ctx.closePath();
					return;
					break;
				default:
					console.error("SVG-CANVAS Error: Unknown command ", command);
					ctx.restore();
					return;
			}
		}
	}
};