"use strict";

var Gpio = require('../onoff').Gpio,  // Constructor function for Gpio objects.
  button = new Gpio(4, 'in', 'both'), // Export GPIO #4 as an interrupt
  led = new Gpio(14, 'out');         // Export GPIO #14 as an output.

var shell = require('shelljs');
shell.echo('hello world');

console.log('Please press the button on GPIO #4...');

// The callback passed to watch will be called when the button on GPIO #4 is
// pressed.
button.watch(function (err, value) {
  if (err) {
    throw err;
  }

  console.log('Button pressed!, Shutting down now');
  led.writeSync(value);
  setTimeout(shell.exec('sudo shutdown -h now'), 2000);

  button.unexport(); // Prevent re-trigger
});

process.on('SIGINT', function () {
  led.unexport();
  button.unexport();
});
