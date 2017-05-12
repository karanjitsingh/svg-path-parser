# svg-path-parser

A simple parser that parses SVG path data and draws it on canvas. This is essentially to support SVG paths in [particle.js](https://github.com/karanjitsingh/particle.js).

## Notes
Mapping ```move```, ```line```, ```cubic-bezier``` and ```quadratic-bezier``` from svg to canvas was fairly simple as there is direct support for these commands in ```CanvasRenderingContext2D``` interface.

Mapping ```elliptical-arc``` command was however a bit more complex. There is no support for elliptical arcs in the interface. I decided to draw the elliptical arc as a series of bezier curves.

## References
* [Rendering an SVG elliptical arc as bezier curves](https://mortoray.com/2017/02/16/rendering-an-svg-elliptical-arc-as-bezier-curves/)
* [Drawing an elliptical arc using polylines, quadratic
or cubic Bezier curves](http://www.spaceroots.org/documents/ellipse/elliptical-arc.pdf) - L. Maisonobe