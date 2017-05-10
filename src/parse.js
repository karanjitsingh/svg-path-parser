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

		while(path.length)
			switch (path.shift()) {
				case 'M':
					x = path.getNextPoint();
					y = path.getNextPoint();
					console.log("Move to ", x, y);
					break;
				case 'm':
					x += path.getNextPoint();
					y += path.getNextPoint();
					console.log("Move to ", x, y);
					break;
				case 'l':
					var x1 = x + path.getNextPoint();
					var y1 = y + path.getNextPoint();
					console.log("Draw line ", x, y, x1, y1);
					x = x1;
					y = y1;
					break;
				case 'L':
					var x1 = path.getNextPoint();
					var y1 = path.getNextPoint();
					console.log("Draw line ", x, y, x1, y1);
					x = x1;
					y = y1;
					break;
				case 'h':
					var x1 = x + path.getNextPoint();
					console.log("Draw line ", x, y, x1, y);
					x = x1;
					break;
				case 'H':
					var x1 = path.getNextPoint();
					console.log("Draw line ", x, y, x1, y);
					x = x1;
					break;
				case 'v':
					var y1 = y + path.getNextPoint();
					console.log("Draw line ", x, y, x, y1);
					y = y1;
					break;
				case 'V':
					var y1 = path.getNextPoint();
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
		}
		ctx.closePath();
	},
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

parser.doMagic(ctx, "M 10 10 H 90 V 90");