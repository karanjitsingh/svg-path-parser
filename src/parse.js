function isNumber(n){
	return String(parseFloat(n)) === n;
}

var parser = {
	doMagic: function(ctx, path) {
		ctx.save();
		ctx.beginPath();

		var x = 0, y=0;

		path = path.split(' ');

		path.getNextPoint = function() {
			return parseFloat(this.shift());
		};

		console.log(path);
		var command='', symbol;

		while(path.length) {
			symbol = path.shift();
			if(!isNumber(symbol)) {
				if (symbol.length > 1)
					path.unshift(symbol.substr(1));
				command = symbol[0];
			}
			else
				path.unshift(symbol);

			var rx, ry;
			rx = ry = 0;

			if(command.toLowerCase() === command) {
				rx = x;
				ry = y;
			}

			switch (command) {
				case 'm':
				case 'M':
					x = path.getNextPoint() + rx;
					y = path.getNextPoint() + ry;
					console.log("Move to ", x, y);
					break;
				case 'l':
				case 'L':
					var x1 = path.getNextPoint() + rx;
					var y1 = path.getNextPoint() + ry;
					console.log("Draw line ", x, y, x1, y1);
					x = x1;
					y = y1;
					break;
				case 'h':
				case 'H':
					var x1 = path.getNextPoint() + rx;
					console.log("Draw line ", x, y, x1, y);
					x = x1;
					break;
				case 'v':
				case 'V':
					var y1 = path.getNextPoint() + ry;
					console.log("Draw line ", x, y, x, y1);
					y = y1;
					break;
				case 'z':
				case 'Z':
					ctx.closePath();
					return;
					break;
				default:
					console.log("Error in parsing");
					ctx.restore();

					console.log(path);
					return;
			}
		}
		ctx.closePath();
	}
};
var ctx = {
	save: function () {
		console.log("Saved canvas state.");
	},
	beginPath: function () {
		console.log("Beginning canvas path.");
	},
	restore: function () {
		console.log("Restoring canvas state.");
	},
	closePath: function () {
		console.log("Closing canvas path.");
	}
};

parser.doMagic(ctx, "M 10 10 H 90 100 V 90");