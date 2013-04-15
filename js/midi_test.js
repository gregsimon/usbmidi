

// TODO

var requestButtonGN = document.getElementById("requestPermissionGN");
var disconnectButton = document.getElementById("disconnect");


requestButtonGN.addEventListener('click', function() {
	

	usbmidi_driver_init(0x09e8, 0x0076); // AKAI LPK25
});

disconnectButton.addEventListener('click', function() {
	usbmidi_driver_disconnect();
});





