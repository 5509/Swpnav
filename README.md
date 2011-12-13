# Swpnav

Path and Facebook like navigation brought you web site.

## usage

### simple

To instert below code end of body element or state of document ready.

	Swpnav('#content', '#nav');

### with options

execution with options.

	Swpnav('#content', '#nav', {
	  slide: 230,
	  duration: '0.5s',
	  timingFunction: 'ease'
	});

### with APIs

Swpnav has some APIs listed below.

* open - open navigation
* close - close navigation
* destroy - destroy swpnav

with

	var open = document.getElementById('open');
	var swp = Swpnav('#content', '#nav');

	open.addEventListener('click', function(ev) {
	  ev.preventDefault();

	  if ( swp.state ) {
	    swp.close();
	  } else {
	    swp.open();
	  }
	}, false);
