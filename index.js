/* globals window, document, IntersectionObserver, cancelAnimationFrame */
export default function lazyLoad(options_) {
	const options = {
		pageUpdatedEventName: 'page:updated',
		elements:
			'img[data-src], img[data-srcset], source[data-srcset], iframe[data-src], video[data-src], [data-lazyload]',
		rootMargin: '0px',
		threshold: 0,
		maxFrameCount: 10,
	};

	// Set up
	let frameLoop;
	let frameCount;
	let els = [];
	let elsLength;
	let observer;
	let checkType;

	/**
	 * Converts HTML collections to an array
	 * @private
	 * @param {Array} array to convert
	 * a loop will work in more browsers than the slice method
	 */
	function _htmlCollectionToArray(collection) {
		let a = [];
		let i = 0;
		for (a = [], i = collection.length; i; ) {
			a[--i] = collection[i];
		}

		return a;
	}

	/**
	 * Checks if an element is in the viewport
	 * @private
	 * @param {Node} element to check.
	 * @returns {Boolean} true/false.
	 */
	function _elementInViewport(element) {
		element = element.tagName === 'SOURCE' ? element.parentNode : element;
		const rect = element.getBoundingClientRect();
		return (
			rect.bottom > 0 &&
			rect.right > 0 &&
			rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
			rect.top < (window.innerHeight || document.documentElement.clientHeight)
		);
	}

	/**
	 * Removes data- attributes
	 * @private
	 * @param {Node} element to update
	 */
	function _removeDataAttrs(element) {
		element.removeAttribute('data-src');
		element.removeAttribute('data-srcset');
		element.removeAttribute('data-lazyload');
	}

	/**
	 * On loaded, removes event listener, removes data- attributes
	 * @private
	 */
	function _loaded() {
		this.removeEventListener('load', _loaded);
		_removeDataAttrs(this);
	}

	/**
	 * Update an element
	 * @private
	 * @param {Node} element to update
	 */
	function _updateElement(element) {
		const srcset = element.getAttribute('data-srcset');
		const src = element.getAttribute('data-src');
		const dlazyload = element.getAttribute('data-lazyload') !== null;
		//
		if (srcset) {
			// If source set, update and try picturefill
			element.setAttribute('srcset', srcset);
			if (window.picturefill) {
				window.picturefill({
					elements: [element],
				});
			}
		}

		if (src) {
			// If source set, update
			element.src = src;
		}

		if (dlazyload) {
			element.dataset.lazyloaded = '';
			element.removeEventListener('load', _loaded);
			_removeDataAttrs(element);
		}
	}

	/**
	 * The callback from the IntersectionObserver
	 * @private
	 * @entries {Nodes} elements being observed by the IntersectionObserver
	 */
	function _intersection(entries) {
		// Disconnect if we've already loaded all of the images
		if (elsLength === 0) {
			observer.disconnect();
		}

		// Loop through the entries
		for (const entry of entries) {
			// Are we in viewport?
			if (entry.intersectionRatio > 0) {
				elsLength--;
				// Stop watching this and load the image
				observer.unobserve(entry.target);
				entry.target.addEventListener('load', _loaded, false);
				_updateElement(entry.target);
			}
		}
	}

	/**
	 * Loops images, checks if in viewport, updates src/src-set
	 * @private
	 */
	function _setSrcs() {
		let i;
		// Browser capability check
		switch (checkType) {
			case 'really-old': {
				elsLength = els.length;
				for (i = 0; i < elsLength; i++) {
					if (els[i]) {
						_updateElement(els[i]);
						_removeDataAttrs(els[i]);
					}
				}

				els = [];

				break;
			}

			case 'old': {
				// Debounce checking
				if (frameCount === options.maxFrameCount) {
					// Update cache of this for the loop
					elsLength = els.length;
					for (i = 0; i < elsLength; i++) {
						// Check if this array item exists, hasn't been loaded already and is in the viewport
						if (
							els[i] &&
							els[i].lazyloaded === undefined &&
							_elementInViewport(els[i])
						) {
							// Cache this array item
							const thisElement = els[i];
							// Set this array item to be undefined to be cleaned up later
							els[i] = undefined;
							// Give this element a property to stop us running twice on one thing
							thisElement.lazyloaded = true;
							// Add an event listener to remove data- attributes on load
							thisElement.addEventListener('load', _loaded, false);
							// Update
							_updateElement(thisElement);
						}
					}

					// Clean up array
					for (i = 0; i < elsLength; i++) {
						if (els[i] === undefined) {
							els.splice(i, 1);
						}
					}

					// Reset let to decide if to continue running
					elsLength = els.length;
					// Will shortly be set to 0 to start counting
					frameCount = -1;
				}

				// Run again? kill if not
				if (elsLength > 0) {
					frameCount++;
					frameLoop = window.requestAnimationFrame(_setSrcs);
				}

				break;
			}

			case 'new': {
				observer = new IntersectionObserver(_intersection, {
					rootMargin: options.rootMargin,
					threshold: options.threshold,
				});
				elsLength = els.length;
				for (i = 0; i < elsLength; i++) {
					if (els[i] && els[i].lazyloaded === undefined) {
						observer.observe(els[i]);
					}
				}

				break;
			}
			// No default
		}
	}

	/**
	 * Gets the show on the road
	 * @private
	 */
	function _init() {
		// Kill any old loops if there are any
		if (checkType === 'old') {
			try {
				cancelAnimationFrame(frameLoop);
			} catch {}
		} else if (checkType === 'new') {
			try {
				observer.disconnect();
			} catch {}
		}

		// Grab elements to lazy load
		els = _htmlCollectionToArray(document.querySelectorAll(options.elements));
		elsLength = els.length;
		frameCount = options.maxFrameCount;
		// Go go go
		_setSrcs();
	}

	/**
	 * GO GO GO
	 * @public
	 * @param {object} options (see readme)
	 */
	function _lazyLoad() {
		for (const item in options_) {
			if (Object.prototype.hasOwnProperty.call(options_, item)) {
				options[item] = options_[item];
			}
		}

		if (
			!('addEventListener' in window) ||
			!window.requestAnimationFrame ||
			typeof document.body.getBoundingClientRect === undefined
		) {
			checkType = 'really-old';
		} else if ('IntersectionObserver' in window) {
			checkType = 'new';
		} else {
			checkType = 'old';
		}

		_init();
		if (options.pageUpdatedEventName) {
			document.addEventListener(options.pageUpdatedEventName, _init, true);
		}
	}

	_lazyLoad();
}
