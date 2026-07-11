/* global Module, Log */

/**
 * MMM-AutoScale
 *
 * Uniformly scales an entire MagicMirror layout from a fixed design canvas
 * to the current browser viewport.
 *
 * No node_helper.js, external libraries, or custom.css changes are required.
 */
/***
 Copyright (C) 2026 Dr. Jody Paul
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see https://www.gnu.org/licenses/
***/
Module.register("MMM-AutoScale", {
	defaults: {
		// CSS-pixel dimensions for which the MagicMirror layout was designed.
		designWidth: 1920,
		designHeight: 1080,

		// "contain" preserves the entire layout and may leave unused space.
		// "cover" fills the viewport and may crop the layout.
		mode: "contain",

		// Alignment within unused or cropped space.
		// Accepted values: "left", "center", "right", or a number from 0 to 1.
		alignX: "center",

		// Accepted values: "top", "center", "bottom", or a number from 0 to 1.
		alignY: "center",

		// Scaling constraints.
		allowUpscale: true,
		allowDownscale: true,
		minScale: 0,
		maxScale: Number.POSITIVE_INFINITY,

		// Page color visible when "contain" leaves unused space.
		backgroundColor: "black",

		// Delay resize handling slightly to avoid excessive recalculation.
		resizeDebounceMs: 100,

		// Write scale calculations to the browser console.
		debug: false
	},

	start() {
		this.resizeTimer = null;
		this.applied = false;
		this.originalStyles = null;

		this.boundScheduleScale = this.scheduleScale.bind(this);

		window.addEventListener("resize", this.boundScheduleScale, { passive: true });
		window.addEventListener("orientationchange", this.boundScheduleScale, { passive: true });

		// visualViewport handles browser zoom and some kiosk/mobile viewport changes.
		if (window.visualViewport) {
			window.visualViewport.addEventListener(
				"resize",
				this.boundScheduleScale,
				{ passive: true }
			);
		}
	},

	notificationReceived(notification) {
		if (notification === "DOM_OBJECTS_CREATED") {
			// Wait until MagicMirror has completed its initial layout.
			requestAnimationFrame(() => {
				requestAnimationFrame(() => this.applyScale());
			});
		}
	},

	getDom() {
		// The module has no visible content and requires no position.
		const wrapper = document.createElement("div");
		wrapper.style.display = "none";
		return wrapper;
	},

	suspend() {
		// Scaling is a page-level service and normally remains active.
	},

	resume() {
		this.scheduleScale();
	},

	scheduleScale() {
		window.clearTimeout(this.resizeTimer);
		this.resizeTimer = window.setTimeout(
			() => this.applyScale(),
			Math.max(0, Number(this.config.resizeDebounceMs) || 0)
		);
	},

	applyScale() {
		const designWidth = Number(this.config.designWidth);
		const designHeight = Number(this.config.designHeight);

		if (!(designWidth > 0) || !(designHeight > 0)) {
			Log.error(
				"MMM-AutoScale: designWidth and designHeight must be positive numbers."
			);
			return;
		}

		const viewport = this.getViewportSize();

		if (!(viewport.width > 0) || !(viewport.height > 0)) {
			return;
		}

		if (!this.originalStyles) {
			this.captureOriginalStyles();
		}

		const widthScale = viewport.width / designWidth;
		const heightScale = viewport.height / designHeight;

		let scale;
		switch (String(this.config.mode).toLowerCase()) {
			case "cover":
				scale = Math.max(widthScale, heightScale);
				break;
			case "width":
				scale = widthScale;
				break;
			case "height":
				scale = heightScale;
				break;
			case "contain":
			default:
				scale = Math.min(widthScale, heightScale);
				break;
		}

		if (!this.config.allowUpscale) {
			scale = Math.min(scale, 1);
		}
		if (!this.config.allowDownscale) {
			scale = Math.max(scale, 1);
		}

		const configuredMin = Number(this.config.minScale);
		const configuredMax = Number(this.config.maxScale);
		const minScale = Number.isFinite(configuredMin) ? configuredMin : 0;
		const maxScale = Number.isFinite(configuredMax)
			? configuredMax
			: Number.POSITIVE_INFINITY;

		scale = Math.max(minScale, Math.min(maxScale, scale));

		const scaledWidth = designWidth * scale;
		const scaledHeight = designHeight * scale;

		const alignX = this.parseAlignment(
			this.config.alignX,
			{ left: 0, center: 0.5, right: 1 },
			0.5
		);
		const alignY = this.parseAlignment(
			this.config.alignY,
			{ top: 0, center: 0.5, bottom: 1 },
			0.5
		);

		const left = (viewport.width - scaledWidth) * alignX;
		const top = (viewport.height - scaledHeight) * alignY;

		const html = document.documentElement;
		const body = document.body;

		html.style.width = "100%";
		html.style.height = "100%";
		html.style.margin = "0";
		html.style.padding = "0";
		html.style.overflow = "hidden";
		html.style.backgroundColor = this.config.backgroundColor;

		body.style.position = "fixed";
		body.style.boxSizing = "border-box";
		body.style.width = `${designWidth}px`;
		body.style.height = `${designHeight}px`;
		body.style.left = `${left}px`;
		body.style.top = `${top}px`;
		body.style.margin = "0";
		body.style.transformOrigin = "top left";
		body.style.transform = `scale(${scale})`;
		body.style.overflow = "hidden";

		this.applied = true;

		if (this.config.debug) {
			Log.info(
				`MMM-AutoScale: viewport=${viewport.width}x${viewport.height}, ` +
				`design=${designWidth}x${designHeight}, scale=${scale.toFixed(4)}, ` +
				`offset=${left.toFixed(1)},${top.toFixed(1)}, mode=${this.config.mode}`
			);
		}
	},

	getViewportSize() {
		// innerWidth/innerHeight describe the layout viewport used by MagicMirror.
		// visualViewport is deliberately not used for dimensions because its offsets
		// and zoom semantics can vary across browsers.
		return {
			width: window.innerWidth,
			height: window.innerHeight
		};
	},

	parseAlignment(value, names, fallback) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return Math.max(0, Math.min(1, value));
		}

		const normalized = String(value).toLowerCase();
		return Object.prototype.hasOwnProperty.call(names, normalized)
			? names[normalized]
			: fallback;
	},

	captureOriginalStyles() {
		const html = document.documentElement;
		const body = document.body;

		this.originalStyles = {
			html: html.getAttribute("style"),
			body: body.getAttribute("style")
		};
	},

	restoreOriginalStyles() {
		if (!this.originalStyles) {
			return;
		}

		const html = document.documentElement;
		const body = document.body;

		if (this.originalStyles.html === null) {
			html.removeAttribute("style");
		} else {
			html.setAttribute("style", this.originalStyles.html);
		}

		if (this.originalStyles.body === null) {
			body.removeAttribute("style");
		} else {
			body.setAttribute("style", this.originalStyles.body);
		}

		this.applied = false;
	}
});
