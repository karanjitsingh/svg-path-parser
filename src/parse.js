

var parser = {

	doMagic: function (ctx, path) {
		ctx.save();
		ctx.beginPath();

		var x = 0, y = 0;

		path = path.split(',').join(' ').split('\n').join(' ').split(' ');

		function isNumber(n) { return String(parseFloat(n)) === n; }
		function getNextPoint() { return parseFloat(path.shift()); }
		function getNextFlag() { return parseInt(path.shift()); }

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

		function ellipseFromEllipticalArc(x1, rx, ry, phi, fA, fS, x2) {
			// Convert from endpoint to center parametrization, as detailed in:
			//   http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
			if (rx == 0 || ry == 0) {
				ops.push({type: 'lineTo', args: x2});
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

			ctx.save();
			ctx.translate(c[0], c[1]);
			ctx.rotate(phi);
			ctx.scale(rx, ry);
			ctx.arc(0,0,1,start,end, fS ? false : true);
			ctx.restore();

			// ops.push(
			// 	{type: 'save', args: []},
			// 	{type: 'translate', args: [c[0], c[1]]},
			// 	{type: 'rotate', args: [phi]},
			// 	{type: 'scale', args: [rx, ry]},
			// 	{type: 'arc', args: [0, 0, 1, start, end, 1-fS]},
			// 	{type: 'restore', args: []}
			// );
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
					if ('sScC'.indexOf(prevCommand) !== -1) {
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
					if ('tTqQ'.indexOf(prevCommand) !== -1) {
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

					ellipseFromEllipticalArc([x, y], cpx1, cpy1, phi, fa, fs, [x1, y1]);

					x = x1;
					y = y1;
					break;
				case 'z':
				case 'Z':
					console.log("DONE!");
					ctx.closePath();
					return;
					break;
				default:
					console.error("SVG-PATH-PARSER Error: Unknown command ", command);
					return;
			}
		}
	}
};