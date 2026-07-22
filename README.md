# MMM-AutoScale

`MMM-AutoScale` uniformly scales an entire MagicMirror layout from a fixed
design canvas to the current browser viewport.

It is intended for MagicMirror installations whose modules have already been
carefully sized and positioned using fixed measurements. Rather than making
each module independently responsive, it preserves the complete composition
and scales it as a unit.

## Features

- No MagicMirror core modifications
- No `node_helper.js`
- No external dependencies
- No required `custom.css`
- Preserves the layout's proportions
- Responds to browser resizing and orientation changes
- Supports `contain`, `cover`, width-based, and height-based scaling
- Supports configurable alignment and scale limits

## Installation

```
cd ~/MagicMirror/modules
git clone https://github.com/MetroCS/MMM-AutoScale.git
```

No `npm install` step is required.

## Basic configuration

Add the module to the `modules` array in `config/config.js`:

```js
{
	module: "MMM-AutoScale",
	config: {
		designWidth: 1920,
		designHeight: 1080,
		mode: "contain"
	}
},
```

Do not assign a `position`. The module runs without displaying its own DOM content.

Set `designWidth` and `designHeight` to the browser viewport dimensions for
which the existing layout was designed. These are CSS-pixel dimensions, not
necessarily the display panel's advertised physical resolution.

> [!TIP]
To inspect the current viewport, open the browser console and check:
> ```js
> window.innerWidth
> window.innerHeight
> ```

## Scaling modes

### `contain`

```js
mode: "contain"
```

Shows the entire design and preserves its aspect ratio. If the viewport has a
different aspect ratio, unused space appears on two sides. This is the safest
default for digital signage.

### `cover`

```js
mode: "cover"
```

Fills the entire viewport while preserving the aspect ratio. Some content may
be cropped.

### `width`

```js
mode: "width"
```

Scales according to viewport width only. The design may extend beyond the
viewport vertically.

### `height`

```js
mode: "height"
```

Scales according to viewport height only. The design may extend beyond the
viewport horizontally.

## Full configuration

```js
{
	module: "MMM-AutoScale",
	config: {
		designWidth: 1920,
		designHeight: 1080,

		mode: "contain",

		alignX: "center",
		alignY: "center",

		margin: 0,

		allowUpscale: true,
		allowDownscale: true,
		minScale: 0,
		maxScale: Number.POSITIVE_INFINITY,

		backgroundColor: "black",
		resizeDebounceMs: 100,
		debug: false
	}
},
```

## Configuration options

| Option | Default | Description |
|---|---:|---|
| `designWidth` | `1920` | Width of the original design canvas in CSS pixels |
| `designHeight` | `1080` | Height of the original design canvas in CSS pixels |
| `mode` | `"contain"` | `"contain"`, `"cover"`, `"width"`, or `"height"` |
| `alignX` | `"center"` | `"left"`, `"center"`, `"right"`, or a number from `0` to `1` |
| `alignY` | `"center"` | `"top"`, `"center"`, `"bottom"`, or a number from `0` to `1` |
| `margin` | `0` | Size of a border around the displayed canvas in CSS pixels |
| `allowUpscale` | `true` | Permit enlargement above the original design size |
| `allowDownscale` | `true` | Permit reduction below the original design size |
| `minScale` | `0` | Smallest permitted scale factor |
| `maxScale` | `Infinity` | Largest permitted scale factor |
| `backgroundColor` | `"black"` | Color visible around a contained layout |
| `resizeDebounceMs` | `100` | Delay before recalculating after resize |
| `debug` | `false` | Log viewport, scale, and offset calculations |

Numeric alignment values provide intermediate positioning. For example:

```js
alignX: 0.25,
alignY: 0.75
```

## Examples
### Example: preserve a 4K design

```js
{
	module: "MMM-AutoScale",
	config: {
		designWidth: 3840,
		designHeight: 2160,
		mode: "contain",
		backgroundColor: "black"
	}
},
```

### Example: fill the screen and accept cropping

```js
{
	module: "MMM-AutoScale",
	config: {
		designWidth: 1920,
		designHeight: 1080,
		mode: "cover",
		alignX: "center",
		alignY: "center"
	}
},
```

### Example: add a border for better viewing in a web browser window

```js
{
	module: "MMM-AutoScale",
	config: {
		designWidth: 1920,
		designHeight: 1080,
		mode: "contain",
		alignX: "center",
		alignY: "center",
		margin: 10
	}
},
```

## Testing

1. Start MagicMirror in server-only mode.
2. Open the instance in a desktop browser.
3. Resize the browser window.
4. Confirm that the complete layout grows and shrinks uniformly.

Enable logging while testing:

```js
debug: true
```

Then inspect the browser console.

## Important limitation

Uniform scaling cannot simultaneously preserve the design's proportions, show
all content, and fill displays having different aspect ratios.

- `contain` preserves everything but may leave unused space.
- `cover` fills everything but may crop content.
- Stretching independently in each direction is intentionally not supported
  because it would distort text, images, and spacing.

## Compatibility considerations

The module scales `document.body`, so modules whose behavior is based directly
on `window.innerWidth` or `window.innerHeight` still see the physical viewport
rather than the design-canvas dimensions. Most ordinary MagicMirror modules
use DOM layout and scale correctly, but modules that perform their own
viewport-dependent calculations may need separate testing.

> [!CAUTION]
> Use only one `MMM-AutoScale` instance in a MagicMirror configuration.

---
MMM-AutoScale is a MagicMirror module to scale an entire layout  
Copyright &copy; 2026 Dr. Jody Paul

This program is free software: you can redistribute it and/or modify
it under the terms of the [GNU General Public License](LICENSE) as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
