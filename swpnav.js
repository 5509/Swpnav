/**
 * Swpnav
 *
 * @version      0.1
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/Swpnav
 *
 * 2011-12-13 17:40
 */
;(function(window, document, undefined) {

var document = window.document,
	support = {
		translate3d: ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()),
		touch: ('ontouchstart' in window)
	},
	touchStartEvent =  support.touch ? 'touchstart' : 'mousedown',
	touchMoveEvent =  support.touch ? 'touchmove' : 'mousemove',
	touchEndEvent =  support.touch ? 'touchend' : 'mouseup';

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
				duration: '0.3s',
				timingFunction: 'cubic-bezier(0,0,0.25,1)'
			}, conf || {});

			css(self.content, {
				webkitTransitionProperty: '-webkit-transform',
				webkitTransitionTimingFunction: self.conf.timingFunction,
				webkitTransitionDuration: 0,
				webkitTransform: translate(0)
			});

			self.ms_duration = parseFloat(self.conf.duration) * 1000;

			self.content.addEventListener(touchStartEvent, self, false);
			self.content.addEventListener(touchMoveEvent, self, false);
			self.content.addEventListener(touchEndEvent, self, false);

			return self;
		},

		handleEvent: function(ev) {
			var self = this;

			switch ( ev.type ) {
			case touchStartEvent:
				self._touchstart(ev);
				break;
			case touchMoveEvent:
				self._touchmove(ev);
				break;
			case touchEndEvent:
				self._touchend(ev);
				break;
			case 'click':
				self._click(ev);
				break;
			}
		},

		_touchstart: function(ev) {
			var self = this;

			self.touchstart_time = +(new Date);
			self.touchstart_flg = true;
			self.touchmove_flg = false;
			self.pos.start = {
				x: getPage(ev, 'pageX'),
				y: getPage(ev, 'pageY')
			};
		},

		_touchmove: function(ev) {
			var self = this,
				diff = undefined,
				time = undefined,
				has_no_prev = self.pos.end,
				slide_disable = self.slide_disable,
				cond_a = undefined,
				cond_b = undefined,
				cond_c = undefined,
				cond_d = undefined;

			if ( !self.touchstart_flg ) return;

			time = +(new Date);

			// if first touchmove time ellapsed from first touch
			// clear touchstart flg
			if ( self.touchstart_flg
			 && !self.touchmove_flg
			 && (time - self.touchstart_time) > 200 ) {
				self.touchstart_flg = false;
				return;
			}
			self.touchmove_flg = true;

			self.pos.prev = self.pos.end || self.pos.start;
			self.pos.end = {
				x: getPage(ev, 'pageX'),
				y: getPage(ev, 'pageY')
			};

			if ( !has_no_prev ) return;

			diff = {
				x: self.pos.end.x - self.pos.prev.x,
				y: self.pos.end.y - self.pos.prev.y
			};

			if ( !slide_disable.pp ) {
				slide_disable.pp = diff;
				return;
			} else
			if ( !slide_disable.p ) {
				slide_disable.p = diff;
				return;
			} else
			if ( !slide_disable.c ) {
				slide_disable.c = diff;

				cond_a = Math.abs(slide_disable.p.y - slide_disable.pp.y) > 1;
				cond_b = Math.abs(slide_disable.c.y - slide_disable.p.y) > 1;
				cond_c = Math.abs(slide_disable.c.y - slide_disable.pp.y) > 2;

				if ( (cond_a && cond_b) || cond_c ) {
					self.touchstart_flg = false;
				}
				return;
			}

			if ( diff.x > 2 ) {
				ev.preventDefault();
			}

			// slide panel
			self.pos.current.x = self.pos.current.x + diff.x;
			if ( self.pos.current.x < 0 ) {
				self.pos.current.x = 0;
			}

			css(self.content, {
				webkitTransform: translate(self.pos.current.x)
			});
		},

		_touchend: function(ev) {
			var self = this,
				conf = self.conf,
				x = self.pos.current.x,
				cond_x = undefined,
				cond_y = undefined,
				cond = undefined;

			self.pos.end = self.pos.end || self.pos.start;
			cond_x = (self.pos.end.x - self.pos.start.x) > 10;
			cond_y = (self.pos.end.y - self.pos.start.y) > 10;
			cond = !self.touchmove_flg && !cond_y && cond_x;

			if ( !self.touchmove_flg && self.state ) {
				self.close();
			} else
			// if panel is closed
			if ( !self.state ) {
				if ( x > 50 || cond ) {
					self.open();
				} else {
					self.close();
				}
			// else panel is opened
			} else {
				if ( x < (conf.slide - 50) || cond ) {
					self.close();
				} else {
					self.open();
				}
			}

			self.slide_disable.pp = null;
			self.slide_disable.p = null;
			self.slide_disable.c = null;
			self.pos.prev = null;
			self.pos.end = null;
			self.touchstart_flg = false;
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

			self.pos.current.x = conf.slide;
			self._setNoAnim(true);
		},

		close: function() {
			var self = this,
				conf = self.conf;

			css(self.content, {
				webkitTransitionDuration: conf.duration,
				webkitTransform: translate(0)
			});

			self.pos.current.x = 0;
			self._setNoAnim(false);
		},

		destroy: function() {
			var self = this;

			self.content.removeEventListener(touchStartEvent, self, false);
			self.content.removeEventListener(touchMoveEvent, self, false);
			self.content.removeEventListener(touchEndEvent, self, false);
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

	function getPage(ev, page) {
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
