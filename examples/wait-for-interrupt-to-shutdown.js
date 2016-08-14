//
// User-set values:
//
var fullPath = '../my/path/..';
var myProcess = 'node loop.js';
var logFile = '_loop_log';

// -------- General Configuration -------- //

var Gpio = require('onoff').Gpio;  // Constructor function for Gpio objects.

var button = new Gpio(4, 'in', 'both'); // Export GPIO #4 as an interrupt
var led = new Gpio(14, 'out');         // Export GPIO #14 as an output.

var shell = require('shelljs');
var moment = require('moment');
var fs = require('fs-extra');

// Synchronous version of fs.access with a silent error (for if loops!):
function existSync(filename) {
  var status = true;
  try {
    fs.accessSync(filename, fs.F_OK);
  } catch (e) {
    status = false;
  }
  return status;
}

// -------- Use the user-set variables -------- //

// Go to process directory (SET ABOVE)
shell.cd(fullPath);
// console.log(shell.ls());

// Configure debugging directory (SET ABOVE)
var dir = fullPath + '/logs/';
fs.ensureDirSync(dir);

// Start your looping process (SET ABOVE):
var child = shell.exec(myProcess, { async: true });

//
// Create a robust logging method:
function logData(buf) {
  var data = buf.trim();
  // Config file and directory:
  var date = new Date();
  var file = dir + moment(date).format('YYYY_MM_DD') + logFile + '.txt';
  var tsData = moment(date).format('HH:mm:ss') + ': ' + data + '\n';
  if (!existSync(file)) {
    fs.writeFileSync(file);
  }
  // Write to file:
  fs.appendFile(file, tsData, function(err) {
    if (err) throw err;
  });
};

// -------- Respond to child -------- //

// Log stdout to a file logging system (logs/YYYY_MM_DD_(your filename).txt)
child.stdout.on('data', function(data) {
  // console.log('[stdout]: "%s"', String(data).trim());
  logData(data);
});
child.stderr.on('data', function(data) {
  // console.log('[stderr]: "%s"', String(data).trim());
  logData(data);
});
child.on('close', function() {
  // console.log('[CLOSED]');
  logData('.\n\n[CLOSED]\n\n.');
});

// -------- Watch for a real world button press event -------- //

button.watch(function(err, value) {
  if (err) throw err;
  console.log('Button pressed!, Shutting down now');
  led.writeSync(value); // power the LED as a visual cue

  setTimeout(shell.exec('sudo shutdown -h now'), 3000);
  button.unexport(); // Prevent re-trigger
});

process.on('SIGINT', function() {
  led.unexport();
  button.unexport();
});
