# svg-path-parser

SVG path parser is a custom path 2D parser written specifically for [particle.js](https://github.com/karanjitsingh/particle.js) to support animation for any path. Particle.js requires path length and nth point for each path element that is created in a path 2D, for this very reason I had to write a custom parser that converts those path elements into custom path functions which provide its length and a method to get the nth point on the path.

A simple parser that parses SVG path data and draws it on canvas. This is essentially to support SVG paths in [particle.js](https://github.com/karanjitsingh/particle.js).

## Notes
Mapping ```move```, ```line```, ```cubic-bezier``` and ```quadratic-bezier``` from svg to canvas is fairly simple as there is direct support for these commands in ```CanvasRenderingContext2D``` interface. To map a circle, we rotate and stretch the canvas before drawing an elliptical arc. See http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes for how to calculate these rotations and scalings.

## References
* [Rendering an SVG elliptical arc as bezier curves](https://mortoray.com/2017/02/16/rendering-an-svg-elliptical-arc-as-bezier-curves/)
* [Drawing an elliptical arc using polylines, quadratic or cubic Bezier curves](http://www.spaceroots.org/documents/ellipse/elliptical-arc.pdf) - L. Maisonobe
* [Path 2D library: canvas-5-polyfill](https://github.com/google/canvas-5-polyfill)
