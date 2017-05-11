function isNumber(n) {
	return String(parseFloat(n)) === n;
}

var parser = {
	doMagic: function (ctx, path) {
		ctx.save();
		ctx.beginPath();

		var x = 0, y = 0;

		path = path.split(',').join(' ').split('\n').join(' ').split(' ');

		var getNextPoint = function () {
			return parseFloat(path.shift());
		};

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

			var rx, ry, x1, y1, cpx1, cpx2, cpy1, cpy2, m, c, tx2, ty2;
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
					if(prevCommand === 's' || prevCommand === 'S' || prevCommand === 'C' || prevCommand === 'c') {
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
					y = y1

					break;

				case 'z':
				case 'Z':
					console.log("DONE!")
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