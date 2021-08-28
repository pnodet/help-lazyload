export default function lazyLoad(opts) {
	const options = {
		pageUpdatedEventName: 'page:updated',
		elements:
			'img[data-src], img[data-srcset], source[data-srcset], iframe[data-src], video[data-src], [data-lazyload]',
		rootMargin: '0px',
		threshold: 0,
		maxFrameCount: 10,
	};

	// set up
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
	function _elInViewport(el) {
		el = el.tagName === 'SOURCE' ? el.parentNode : el;
		const rect = el.getBoundingClientRect();
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
	function _removeDataAttrs(el) {
		el.removeAttribute('data-src');
		el.removeAttribute('data-srcset');
		el.removeAttribute('data-lazyload');
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
	function _updateEl(el) {
		const srcset = el.getAttribute('data-srcset');
		const src = el.getAttribute('data-src');
		const dlazyload = el.getAttribute('data-lazyload') !== null;
		//
		if (srcset) {
			// if source set, update and try picturefill
			el.setAttribute('srcset', srcset);
			if (window.picturefill) {
				window.picturefill({
					elements: [el],
				});
			}
		}
		if (src) {
			// if source set, update
			el.src = src;
		}
		if (dlazyload) {
			el.setAttribute('data-lazyloaded', '');
			el.removeEventListener('load', _loaded);
			_removeDataAttrs(el);
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
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			// Are we in viewport?
			if (entry.intersectionRatio > 0) {
				elsLength--;
				// Stop watching this and load the image
				observer.unobserve(entry.target);
				entry.target.addEventListener('load', _loaded, false);
				_updateEl(entry.target);
			}
		}
	}

	/**
	 * Loops images, checks if in viewport, updates src/src-set
	 * @private
	 */
	function _setSrcs() {
		let i;
		// browser capability check
		if (checkType === 'really-old') {
			elsLength = els.length;
			for (i = 0; i < elsLength; i++) {
				if (els[i]) {
					_updateEl(els[i]);
					_removeDataAttrs(els[i]);
				}
			}
			els = [];
		} else if (checkType === 'old') {
			// debounce checking
			if (frameCount === options.maxFrameCount) {
				// update cache of this for the loop
				elsLength = els.length;
				for (i = 0; i < elsLength; i++) {
					// check if this array item exists, hasn't been loaded already and is in the viewport
					if (
						els[i] &&
						els[i].lazyloaded === undefined &&
						_elInViewport(els[i])
					) {
						// cache this array item
						const thisEl = els[i];
						// set this array item to be undefined to be cleaned up later
						els[i] = undefined;
						// give this element a property to stop us running twice on one thing
						thisEl.lazyloaded = true;
						// add an event listener to remove data- attributes on load
						thisEl.addEventListener('load', _loaded, false);
						// update
						_updateEl(thisEl);
					}
				}
				// clean up array
				for (i = 0; i < elsLength; i++) {
					if (els[i] === undefined) {
						els.splice(i, 1);
					}
				}
				// reset let to decide if to continue running
				elsLength = els.length;
				// will shortly be set to 0 to start counting
				frameCount = -1;
			}

			// run again? kill if not
			if (elsLength > 0) {
				frameCount++;
				frameLoop = window.requestAnimationFrame(_setSrcs);
			}
		} else if (checkType === 'new') {
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
		}
	}

	/**
	 * Gets the show on the road
	 * @private
	 */
	function _init() {
		// kill any old loops if there are any
		if (checkType === 'old') {
			try {
				cancelAnimationFrame(frameLoop);
			} catch (err) {}
		} else if (checkType === 'new') {
			try {
				observer.disconnect();
			} catch (err) {}
		}
		// grab elements to lazy load
		els = _htmlCollectionToArray(document.querySelectorAll(options.elements));
		elsLength = els.length;
		frameCount = options.maxFrameCount;
		// go go go
		_setSrcs();
	}

	/**
	 * GO GO GO
	 * @public
	 * @param {object} options (see readme)
	 */
	function _lazyLoad() {
		for (const item in opts) {
			if (opts.hasOwnProperty(item)) {
				options[item] = opts[item];
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
};
