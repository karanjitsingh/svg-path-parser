var CanvasCommand;
(function (CanvasCommand) {
    CanvasCommand["Move"] = "moveTo";
    CanvasCommand["Line"] = "lineTo";
    CanvasCommand["BezierCurve"] = "bezierCurveTo";
    CanvasCommand["QuadraticCurve"] = "quadraticCurveTo";
    CanvasCommand["EllipticalArc"] = "arc";
    CanvasCommand["Save"] = "save";
    CanvasCommand["Translate"] = "translate";
    CanvasCommand["Rotate"] = "rotate";
    CanvasCommand["Scale"] = "scale";
    CanvasCommand["Restore"] = "restore";
    CanvasCommand["ClosePath"] = "closePath";
})(CanvasCommand || (CanvasCommand = {}));
var RegexPatterns;
(function (RegexPatterns) {
    RegexPatterns[RegexPatterns["Num"] = 0] = "Num";
    RegexPatterns[RegexPatterns["Flag"] = 1] = "Flag";
    RegexPatterns[RegexPatterns["WS"] = 2] = "WS";
    RegexPatterns[RegexPatterns["Commands"] = 3] = "Commands";
})(RegexPatterns || (RegexPatterns = {}));
var SVGPath = (function () {
    function SVGPath(d) {
        this.paths = [];
        this.parseError = false;
        this.paths = this.ParsePath2D(d);
    }
    SVGPath.relToAbs = function (rel, args) {
        for (var i = 0; i < args.length; i++)
            args[i] += i % 2 == 0 ? rel.x : rel.y;
    };
    SVGPath.prototype.ParsePath2D = function (d) {
        var match;
        var commandList = [];
        var pathList = [];
        var matchPattern = function (p, flags) {
            var m;
            if ((m = d.match(new RegExp("^" + SVGPath.Patterns[p], flags))) !== null) {
                d = d.substr(m[0].length);
                parserPos += m[0].length;
                match = m;
            }
            else if ((m = d.match(new RegExp("^" + SVGPath.Patterns[RegexPatterns.Num], flags))) !== null) {
                match = [commandList[commandList.length - 1].command];
            }
            else
                match = null;
            return match !== null;
        };
        var p = "";
        var parserPos = 0;
        var ctxPos = {
            x: 0,
            y: 0
        };
        var drawOrigin = {
            x: 0,
            y: 0
        };
        while (d.length > 0) {
            matchPattern(RegexPatterns.WS);
            if (matchPattern(RegexPatterns.Commands)) {
                var cmd = match[0];
                var relative = cmd.toLowerCase() === cmd;
                var signature = SVGPath.Signatures[cmd.toUpperCase()];
                var pattern = signature.regexPattern;
                var _args = null;
                p += " " + cmd;
                var svgCmd = {
                    command: match[0],
                    args: [],
                };
                var canvasCmd = {
                    f: signature.canvasCommand,
                    args: []
                };
                for (var i = 0; i < pattern.length; i++) {
                    matchPattern(RegexPatterns.WS);
                    if (matchPattern(pattern[i])) {
                        svgCmd.args.push(pattern[i] === RegexPatterns.Num ? parseFloat(match[0]) : parseInt(match[0]));
                    }
                    else {
                        this.parseError = true;
                        console.error("Error parsing svg path at " + parserPos);
                        return pathList;
                    }
                }
                p += " " + svgCmd.args.join(" ");
                if (pathList.length > 1 && ((cmd.toUpperCase() == "S" && "cCsS".indexOf(commandList[commandList.length - 1].command) !== -1) || (cmd.toUpperCase() == "T" && "qQtT".indexOf(commandList[commandList.length - 1].command) !== -1))) {
                    _args = pathList[pathList.length - 1].args;
                }
                commandList.push(svgCmd);
                pathList.push.apply(pathList, signature.toCanvas(ctxPos, relative, cmd.toUpperCase() == "Z" ? [drawOrigin.x, drawOrigin.y] : svgCmd.args, _args));
                if (cmd.toUpperCase() == "M") {
                    drawOrigin.x = pathList[pathList.length - 1].args[0];
                    drawOrigin.y = pathList[pathList.length - 1].args[1];
                }
            }
            else if (d.length > 0) {
                this.parseError = true;
                console.error("Error parsing svg path at " + parserPos);
                break;
            }
        }
        return pathList;
    };
    SVGPath.parseEllipticalArc = function (x1, r, phi, fA, fS, x2) {
        function mag(v) {
            return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
        }
        function dot(u, v) {
            return (u.x * v.x + u.y * v.y);
        }
        function ratio(u, v) {
            return dot(u, v) / (mag(u) * mag(v));
        }
        function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }
        function angle(u, v) {
            var sign = 1.0;
            if ((u.x * v.y - u.y * v.x) < 0) {
                sign = -1.0;
            }
            return sign * Math.acos(clamp(ratio(u, v), -1, 1));
        }
        function rotClockwise(v, angle) {
            var cost = Math.cos(angle);
            var sint = Math.sin(angle);
            return { x: cost * v.x + sint * v.y, y: -1 * sint * v.x + cost * v.y };
        }
        function rotCounterClockwise(v, angle) {
            var cost = Math.cos(angle);
            var sint = Math.sin(angle);
            return { x: cost * v.x - sint * v.y, y: sint * v.x + cost * v.y };
        }
        function midPoint(u, v) {
            return { x: (u.x - v.x) / 2.0, y: (u.y - v.y) / 2.0 };
        }
        function meanVec(u, v) {
            return { x: (u.x + v.x) / 2.0, y: (u.y + v.y) / 2.0 };
        }
        function pointMul(u, v) {
            return { x: u.x * v.x, y: u.y * v.y };
        }
        function scale(c, v) {
            return { x: c * v.x, y: c * v.y };
        }
        function sum(u, v) {
            return { x: u.x + v.x, y: u.y + v.y };
        }
        // Convert from endpoint to center parametrization, as detailed in:
        //   http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
        if (r.x == 0 || r.y == 0) {
            return [{ f: CanvasCommand.Line, args: [x2.x, x2.y] }];
        }
        var phi = phi * (Math.PI / 180.0);
        r.x = Math.abs(r.x);
        r.y = Math.abs(r.y);
        var xPrime = rotClockwise(midPoint(x1, x2), phi); // F.6.5.1
        var xPrime2 = pointMul(xPrime, xPrime);
        var r2 = { x: Math.pow(r.x, 2), y: Math.pow(r.y, 2) };
        var lambda = Math.sqrt(xPrime2.x / r2.x + xPrime2.y / r2.y);
        if (lambda > 1) {
            r.x *= lambda;
            r.y *= lambda;
            r2.x = Math.pow(r.x, 2);
            r2.y = Math.pow(r.y, 2);
        }
        var factor = Math.sqrt(Math.abs(r2.x * r2.y - r2.x * xPrime2.y - r2.y * xPrime2.x) / (r2.x * xPrime2.y + r2.y * xPrime2.x));
        if (fA == fS) {
            factor *= -1.0;
        }
        var cPrime = scale(factor, { x: r.x * xPrime.y / r.y, y: -r.y * xPrime.x / r.x }); // F.6.5.2
        var c = sum(rotCounterClockwise(cPrime, phi), meanVec(x1, x2)); // F.6.5.3
        var x1UnitVector = { x: (xPrime.x - cPrime.x) / r.x, y: (xPrime.y - cPrime.y) / r.y };
        var x2UnitVector = { x: (-1.0 * xPrime.x - cPrime.x) / r.x, y: (-1.0 * xPrime.y - cPrime.y) / r.y };
        var theta = angle({ x: 1, y: 0 }, x1UnitVector); // F.6.5.5
        var deltaTheta = angle(x1UnitVector, x2UnitVector); // F.6.5.6
        var start = theta;
        var end = theta + deltaTheta;
        return [
            { f: CanvasCommand.Save, args: [] },
            { f: CanvasCommand.Translate, args: [c.x, c.y] },
            { f: CanvasCommand.Rotate, args: [phi] },
            { f: CanvasCommand.Scale, args: [r.x, r.y] },
            { f: CanvasCommand.EllipticalArc, args: [0, 0, 1, start, end, 1 - fS] },
            { f: CanvasCommand.Restore, args: [] }
        ];
    };
    SVGPath.prototype.draw = function (ctx) {
        for (var i = 0; i < this.paths.length; i++) {
            ctx[this.paths[i].f].apply(ctx, this.paths[i].args);
        }
    };
    SVGPath.Patterns = ["(-?(?:[0-9]*)?(?:[.])?[0-9]+)", "([01])", "(?:[,]|[\n \t]*)?", "([MmLlHhVvCcSsQqTtAaZz])"];
    SVGPath.Signatures = {
        // Mm (x y)+
        "M": {
            toCanvas: function (pos, relative, args) {
                var args = args.slice();
                if (relative)
                    SVGPath.relToAbs(pos, args);
                pos.x = args[0];
                pos.y = args[1];
                return [{
                        f: CanvasCommand.Move,
                        args: args
                    }];
            },
            regexPattern: [RegexPatterns.Num, RegexPatterns.Num]
        },
        // Ll (x y)+
        "L": {
            toCanvas: function (pos, relative, args) {
                var args = args.slice();
                if (relative)
                    SVGPath.relToAbs(pos, args);
                pos.x = args[0];
                pos.y = args[1];
                return [{
                        f: CanvasCommand.Line,
                        args: args
                    }];
            },
            regexPattern: [RegexPatterns.Num, RegexPatterns.Num]
        },
        // Hh x+
        "H": {
            toCanvas: function (pos, relative, args) {
                var args = args.slice();
                if (relative)
                    args[0] += pos.x;
                args.push(pos.y);
                pos.x = args[0];
                pos.y = pos.y;
                return [{
                        f: CanvasCommand.Line,
                        args: args
                    }];
            },
            regexPattern: [RegexPatterns.Num],
        },
        // Vv y+
        "V": {
            toCanvas: function (pos, relative, args) {
                var args = args.slice();
                args.unshift(pos.x);
                if (relative)
                    args[1] += pos.y;
                pos.x = pos.x;
                pos.y = args[1];
                return [{
                        f: CanvasCommand.Line,
                        args: args
                    }];
            },
            regexPattern: [RegexPatterns.Num],
        },
        // Cc (x1 y1 x2 y2 x y)+
        "C": {
            toCanvas: function (pos, relative, args) {
                var args = args.slice();
                if (relative)
                    SVGPath.relToAbs(pos, args);
                pos.x = args[4];
                pos.y = args[5];
                return [{
                        f: CanvasCommand.BezierCurve,
                        args: args
                    }];
            },
            regexPattern: [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],
        },
        // Ss (x2 y2 x y)+
        "S": {
            toCanvas: function (pos, relative, args, _args) {
                var args = args.slice();
                if (relative)
                    SVGPath.relToAbs(pos, args);
                var cp1 = {
                    x: pos.x,
                    y: pos.y
                };
                if (_args) {
                    cp1.x = 2 * pos.x - _args[2];
                    cp1.y = 2 * pos.y - _args[3];
                }
                args.unshift(cp1.y);
                args.unshift(cp1.x);
                pos.x = args[4];
                pos.y = args[5];
                return [{
                        f: CanvasCommand.BezierCurve,
                        args: args
                    }];
            },
            regexPattern: [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],
        },
        // Qq (x1 y1 x y)+
        "Q": {
            toCanvas: function (pos, relative, args) {
                var args = args.slice();
                if (relative)
                    SVGPath.relToAbs(pos, args);
                pos.x = args[2];
                pos.y = args[3];
                return [{
                        f: CanvasCommand.QuadraticCurve,
                        args: args
                    }];
            },
            regexPattern: [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num],
        },
        // Tt (x y)+
        "T": {
            toCanvas: function (pos, relative, args, _args) {
                var args = args.slice();
                if (relative)
                    SVGPath.relToAbs(pos, args);
                var cp1 = {
                    x: pos.x,
                    y: pos.y
                };
                if (_args) {
                    cp1.x = 2 * pos.x - _args[0];
                    cp1.y = 2 * pos.y - _args[1];
                }
                args.unshift(cp1.y);
                args.unshift(cp1.x);
                pos.x = args[2];
                pos.y = args[3];
                return [{
                        f: CanvasCommand.QuadraticCurve,
                        args: args
                    }];
            },
            regexPattern: [RegexPatterns.Num, RegexPatterns.Num],
        },
        // Aa (r.x r.y x-axis-rotation large-arc-flag sweep-flag x y)+
        "A": {
            toCanvas: function (pos, relative, args) {
                var args = args.slice();
                if (relative) {
                    args[5] += pos.x;
                    args[6] += pos.y;
                }
                var pathElements = SVGPath.parseEllipticalArc(pos, { x: args[0], y: args[1] }, args[2], args[3], args[4], {
                    x: args[5],
                    y: args[6]
                });
                pos.x = args[5];
                pos.y = args[6];
                return pathElements;
            },
            regexPattern: [RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Num, RegexPatterns.Flag, RegexPatterns.Flag, RegexPatterns.Num, RegexPatterns.Num],
        },
        // Zz
        "Z": {
            toCanvas: function (pos, relative, args) {
                pos.x = args[0];
                pos.y = args[1];
                return [{
                        f: CanvasCommand.Line,
                        args: args
                    }];
            },
            regexPattern: []
        },
    };
    return SVGPath;
}());
//# sourceMappingURL=parse.js.map