

// TODO

var requestButtonGN = document.getElementById("requestPermissionGN");
var disconnectButton = document.getElementById("disconnect");

function midiEvent(e) {
  console.log("MIDI EVENT !!!");
}

requestButtonGN.addEventListener('click', function() {
	usbmidi_driver_init(0x09e8, 0x0076, midiEvent); // AKAI LPK25
});

disconnectButton.addEventListener('click', function() {
	usbmidi_driver_disconnect();
});





