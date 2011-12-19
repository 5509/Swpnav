/**
 * Swpnav
 *
 * @version      0.2.0
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/Swpnav
 *
 * 2011-12-19 04:30
 */
;(function(window, document, undefined) {

	var support = {
			translate3d: ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()),
			touch: ('ontouchstart' in window)
		},
		touch_start_event = support.touch ? 'touchstart' : 'mousedown',
		touch_move_event = support.touch ? 'touchmove' : 'mousemove',
		touch_end_event = support.touch ? 'touchend' : 'mouseup';

	var Swpnav = function(content, nav, conf) {
		if ( this instanceof Swpnav ) {
			return this.init(content, nav, conf);
		}
		return new Swpnav(content, nav, conf);
	};

	Swpnav.prototype = {

		init: function(content, nav, conf) {

			var self = this,
				content_style = undefined;

			self.content = document.querySelector(content);
			self.nav = document.querySelector(nav);
			self.state = false; // true: open, false: close
			self.touch_enabled = true;
			self.current_point = 0;
			self.current_x = 0;
			self.max_x = self.content.offsetWidth;

			self.slide_disable = {
				ppp: undefined,
				pp: undefined,
				p: undefined,
				c: undefined
			};

			self.pos = {
				current: {
					x: 0,
					y: 0
				},
				start: undefined,
				prev: undefined,
				end: undefined
			};

			content_style = getComputedStyle(self.content);

			css(self.nav, {
				position: 'absolute',
				top: 0,
				left: 0
			});

			self.conf = simple_extend({
				slide: 260,
				duration: '0.2s',
				timingFunction: 'cubic-bezier(0,0,0.25,1)'
			}, conf || {});

			css(self.content, {
				webkitTransitionProperty: '-webkit-transform',
				webkitTransitionTimingFunction: self.conf.timingFunction,
				webkitTransitionDuration: 0,
				webkitTransform: translate(0)
			});

			self.ms_duration = parseFloat(self.conf.duration) * 1000;

			self.content.addEventListener(touch_start_event, self, false);
			self.content.addEventListener(touch_move_event, self, false);
			self.content.addEventListener(touch_end_event, self, false);

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

			if ( !self.touch_enabled ) {
				return;
			}

			if ( !support.touch ) {
				ev.preventDefault();
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
				ev.preventDefault();
				ev.stopPropagation();

				dist_x = page_x - self.base_page_x;
				new_x = self.current_x + dist_x;
				if ( new_x >= 0 ) {
					new_x = Math.round(self.current_x + dist_x / 3);
				}

				if ( new_x < 0 ) {
					new_x = 0;
				}

				self.current_x = new_x;
				css(self.content, {
					webkitTransform: translate(new_x)
				});

				self.direction_x = dist_x > 0 ? -1 : 1;
			} else {
				delta_x = Math.abs(page_x - self.start_page_x);
				delta_y = Math.abs(page_y - self.start_page_y);
				if ( delta_x > 5 ) {
					ev.preventDefault();
					ev.stopPropagation();
					self.move_ready = true;

					self.content.addEventListener('click', self, true);
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
				if ( self.current_x > 50 ) {
					self.open();
				} else {
					self.close();
				}
			// else panel is opened
			} else {
				if ( self.current_x < (conf.slide - 50) ) {
					self.close();
				} else {
					self.open();
				}
			}

			setTimeout(function() {
				self.content.removeEventListener('click', self, true);
			}, 200);
		},

		_click: function(ev) {
			var self = this;

			ev.stopPropagation();
			ev.preventDefault();
		},

		_setNoAnim: function(state) {
			var self = this;
			setTimeout(function() {
				css(self.content, {
					webkitTransitionDuration: '0s'
				});

				self.state = state;
			}, self.ms_duration + 10);
		},

		open: function() {
			var self = this,
				conf = self.conf;

			css(self.content, {
				webkitTransitionDuration: conf.duration,
				webkitTransform: translate(conf.slide)
			});
			
			self.current_x = conf.slide;
			self._setNoAnim(true);
		},

		close: function() {
			var self = this,
				conf = self.conf;

			css(self.content, {
				webkitTransitionDuration: conf.duration,
				webkitTransform: translate(0)
			});

			self.current_x = 0;
			self._setNoAnim(false);
		},

		destroy: function() {
			var self = this;

			self.content.removeevListener(touchStartev, self);
			self.content.removeevListener(touchMoveev, self);
			self.content.removeevListener(touchEndev, self);
		}
	};

	function css(elem, styles) {
		var c = undefined;
		for ( c in styles ) {
			elem.style[c] = styles[c];
		}
	}

	function translate(x) {
		return (support.translate3d) ? 'translate3d(' + x + 'px, 0, 0)'
			: 'translate(' + x + 'px, 0)';
	}

	function get_page(ev, page) {
		return support.touch ? ev.changedTouches[0][page] : ev[page];
	}

	function simple_extend(base, obj) {
		var c = undefined;
		for ( c in obj ) {
			if ( !(c in base) ) break;
			base[c] = obj[c];
		}
		return base;
	}

	window.Swpnav = Swpnav;

}(this, this.document));
