/**
 * Swpnav
 *
 * @version      1.0
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/Swpnav
 *
 * 2012-01-31 1:21
 */
;(function(window, document, undefined) {

	var support = {};
	support.css =(function() {
		var set_prefix = function(prop) {
			var upper_prop = toFirstLetterUpperCase(prop);
			var prefixes = [
					prop,
					'Webkit' + upper_prop,
					'Moz' + upper_prop,
					'O' + upper_prop,
					'ms' + upper_prop
				],
				properties = ['', '-webkit-', '-moz-', '-o-', '-ms-'],
				el = document.createElement('div'),
				i = 0, l = prefixes.length;

			for ( ; i < l; i++ ) {
				if ( typeof el.style[prefixes[i]] === 'undefined' ) continue;
				return {
					prefix: prefixes[i],
					prop: properties[i]
				}
			}
			return undefined;
		};
		return {
			transform: set_prefix('transform'),
			transition: set_prefix('transition')
		};
	}());
	support.touch = ('ontouchstart' in window);

	var add_event = 'addEventListener' in window,
		touch_start_event = support.touch ? 'touchstart' : 'mousedown',
		touch_move_event = support.touch ? 'touchmove' : 'mousemove',
		touch_end_event = support.touch ? 'touchend' : 'mouseup';

	// Swpnav
	var Swpnav = function(content, nav, conf) {
		this.namespace = 'Swpnav';
		if ( this instanceof Swpnav ) {
			return this.init(content, nav, conf);
		}
		return new Swpnav(content, nav, conf);
	};

	Swpnav.prototype = {

		init: function(content, nav, conf) {

			var self = this,
				content_style = undefined;

			if ( 'jQuery' in window ) {
				self.content = content;
			} else {
				self.content = document.getElementById(content.replace('#',''));
			}
			self.nav = document.getElementById(nav.replace('#', ''));
			self.state = false; // true: open, false: close
			self.touch_enabled = true;
			self.current_point = 0;
			self.current_x = 0;
			self.max_x = self.content.offsetWidth;
			self.disabled = false;
			self.destroyed = false;

			if ( 'currentStyle' in self.content ) {
				content_style = self.content.currentStyle;
			} else {
				content_style = getComputedStyle(self.content);
			}

			css(self.nav, {
				position: 'absolute',
				top: 0,
				left: 0
			});

			self.conf = simple_extend({
				slide: 260,
				duration: '0.2s',
				timingFunction: 'cubic-bezier(0,0,0.25,1)',
				trigger: 30
			}, conf || {});

			if ( support.css.transform && support.css.transition ) {
				self.transition = true;
				self.ts = support.css.transition;
				self.tf = support.css.transform;
				self.content.style[self.ts.prefix + 'Property'] = self.ts.prop + 'transform';
				self.content.style[self.ts.prefix + 'TimingFunction'] = self.conf.timingFunction;
				self.content.style[self.ts.prefix + 'Duration'] = 0;
				self.content.style[self.tf.prefix + 'Style'] = 'preserve-3d';
				self.content.style[self.tf.prefix] = translate(0);
			} else {
				self.transition = false;
				if ( !/absolute|relative/.test(content_style.position) ) {
					self.content.style.position = 'relative';
				}
			}

			self.ms_duration = parseFloat(self.conf.duration) * 1000;

			if ( add_event ) {
				self.content.addEventListener(touch_start_event, self, false);
				self.content.addEventListener(touch_move_event, self, false);
				self.content.addEventListener(touch_end_event, self, false);
			} else {
				self.handledStart = handle_event(
					self.content,
					touch_start_event,
					function(ev) { self._touchstart(ev); }
				);
				self.handledMove = handle_event(
					self.content,
					touch_move_event,
					function(ev) { self._touchmove(ev); }
				);
				self.handledEnd = handle_event(
					self.content,
					touch_end_event,
					function(ev) { self._touchend(ev); }
				);
			}

			return self;
		},

		handleEvent: function(ev) {
			var self = this;

			switch ( ev.type ) {
			case touch_start_event:
				self._touchstart(ev);
				break;
			case touch_move_event:
				self._touchmove(ev);
				break;
			case touch_end_event:
				self._touchend(ev);
				break;
			case 'click':
				self._click(ev);
				break;
			}
		},

		_touchstart: function(ev) {
			var self = this;

			if ( !self.touch_enabled || self.disabled ) {
				return;
			}

			if ( !support.touch ) {
				if ( add_event ) {
					ev.preventDefault();
				} else {
					ev.returnValue = false;
				}
			}

			self.scrolling = true;
			self.move_ready = false;
			self.start_page_x = get_page(ev, 'pageX');
			self.start_page_y = get_page(ev, 'pageY');
			self.base_page_x = self.start_page_x;
			self.direction_x = 0;
			self.start_time = ev.timeStamp;
		},

		_touchmove: function(ev) {
			var self = this,
				page_x = undefined,
				page_y = undefined,
				dist_x = undefined,
				new_x = undefined,
				delta_x = undefined,
				delta_y = undefined;

			if ( !self.scrolling ) {
				return;
			}

			page_x = get_page(ev, 'pageX');
			page_y = get_page(ev, 'pageY');

			if ( self.move_ready ) {
				if ( add_event ) {
					ev.preventDefault();
					ev.stopPropagation();
				} else {
					ev.returnValue = false;
					ev.cancelBubble = true;
				}

				dist_x = page_x - self.base_page_x;
				new_x = self.current_x + dist_x;
				if ( new_x >= 0 ) {
					new_x = Math.round(self.current_x + dist_x / 3);
				}

				if ( new_x < 0 ) {
					new_x = 0;
				}

				self.current_x = new_x;
				if ( self.transition ) {
					self.content.style[self.tf.prefix] = translate(new_x);
				} else {
					self.content.style.left = new_x + 'px';
				}

				self.direction_x = dist_x > 0 ? -1 : 1;
			} else {
				delta_x = Math.abs(page_x - self.start_page_x);
				delta_y = Math.abs(page_y - self.start_page_y);
				if ( delta_x > 5 ) {
					if ( add_event ) {
						ev.preventDefault();
						ev.stopPropagation();
					} else {
						ev.returnValue = false;
						ev.cancelBubble = true;
					}
					self.move_ready = true;
				} else
				if ( delta_y > 5 ) {
					self.scrolling = false;
				}
			}

			self.base_page_x = page_x;
		},

		_touchend: function(ev) {
			var self = this,
				conf = self.conf;

			if ( !self.scrolling ) {
				return;
			}

			self.scrolling = false;

			if ( !self.move_ready && self.state ) {
				self.close();
			} else
			// if panel is closed
			if ( !self.state ) {
				if ( self.current_x > conf.trigger ) {
					self.open();
				} else {
					self.close();
				}
			// else panel is opened
			} else {
				if ( self.current_x < (conf.slide - conf.trigger) ) {
					self.close();
				} else {
					self.open();
				}
			}
		},

		_click: function(ev) {
			var self = this;

			if ( add_event ) {
				ev.preventDefault();
				ev.stopPropagation();
			} else {
				ev.returnValue = false;
				ev.cancelBubble = true;
			}
		},

		_setNoAnim: function(state) {
			var self = this;
			setTimeout(function() {
				if ( self.transition ) {
					self.content.style[self.ts.prefix + 'Duration'] = '0s';
				}

				self.state = state;
			}, self.ms_duration + 10);
		},

		getState: function() {
			var self = this;
			return self.state;
		},

		setSlide: function(slide) {
			var self = this;
			self.conf.slide = slide;
		},

		enable: function() {
			var self = this;
			self.disabled = false;
		},

		disable: function() {
			var self = this;
			self.disabled = true;
		},

		open: function() {
			var self = this,
				conf = self.conf;

			if ( self.disabled || self.destroyed ) {
				return;
			}

			if ( self.transition ) {
				self.content.style[self.ts.prefix + 'Duration'] = conf.duration;
				self.content.style[self.tf.prefix] = translate(conf.slide);
			} else {
				self.content.style.left = conf.slide + 'px';
			}

			self.current_x = conf.slide;
			self._setNoAnim(true);
		},

		close: function() {
			var self = this,
				conf = self.conf;

			if ( self.disabled || self.destroyed ) {
				return;
			}

			if ( self.transition ) {
				self.content.style[self.ts.prefix + 'Duration'] = conf.duration;
				self.content.style[self.tf.prefix] = translate(0);
			} else {
				self.content.style.left = '0px';
			}

			self.current_x = 0;
			self._setNoAnim(false);
		},

		destroy: function() {
			var self = this;
			console.log('hogehogehgoegho');
			self.destroyed = true;

			if ( add_event ) {
				self.content.removeEventListener(touch_start_event, self, false);
				self.content.removeEventListener(touch_move_event, self, false);
				self.content.removeEventListener(touch_end_event, self, false);
			} else {
				self.handledStart.detach();
				self.handledMove.detach();
				self.handledEnd.detach();
			}
		}
	};

	function handle_event(elem, listener, func) {
		var _func = func;
		elem.attachEvent('on' + listener, _func);
		return {
			detach: function() {
				elem.detachEvent('on' + listener, _func);
			}
		}
	}

	function css(elem, styles) {
		var c = undefined;
		for ( c in styles ) {
			elem.style[c] = styles[c];
		}
	}

	function translate(x) {
		return 'translate(' + x + 'px, 0)';
	}

	function get_page(ev, page) {
		var page_pos = undefined,
			b = document.body,
			dE = document.documentElement;
		// mobile
		if ( support.touch ) {
			page_pos = ev.changedTouches[0][page];
		// except IE8-
		} else
		if ( ev[page] ) {
			page_pos = ev[page];
		// IE8-
		} else {
			if ( page === 'pageX' ) {
				page_pos = ev.clientX + b.scrollLeft + dE.scrollLeft;
			} else {
				page_pos = ev.clientY + b.scrollTop + dE.scrollTop;
			}
		}
		return page_pos;
	}

	function simple_extend(base, obj) {
		var c = undefined;
		for ( c in obj ) {
			if ( !(c in base) ) break;
			base[c] = obj[c];
		}
		return base;
	}

	function extend_method(base, obj) {
		var c = undefined,
			namespace = toFirstLetterLowerCase(obj.namespace),
			method_name = undefined;
		for ( c in obj ) {
			if ( typeof obj[c] !== 'function'
			  || /(?:^_)|(?:^handleEvent$)|(?:^init$)/.test(c) ) {
				continue;
			}
			method_name = namespace + toFirstLetterUpperCase(c);
			base[method_name] = (function() {
				var p = c;
				return function(arguments) {
					return obj[p](arguments);
				}
			}());
		}
	}

	function toFirstLetterUpperCase(string) {
		return string.replace(
			/(^[a-z])/,
			function($1) {
				return $1.toUpperCase();
			}
		);
	}

	function toFirstLetterLowerCase(string) {
		return string.replace(
			/(^[A-Z])/,
			function($1) {
				return $1.toLowerCase();
			}
		);
	}

	window.Swpnav = Swpnav;

	if ( !('jQuery' in window) ) {
		return;
	}
	jQuery.fn.swpnav = function(nav, conf) {
		var swpnav = Swpnav(this[0], nav, conf),
			c = undefined;

		extend_method(this, swpnav);

		return this;
	};

}(this, this.document));
