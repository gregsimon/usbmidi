

// TODO

var requestButtonGN = document.getElementById("requestPermissionGN");
var disconnectButton = document.getElementById("disconnect");

function midiEvent(cin, m0, m1, m2) {
    //console.log(cin+" "+m0+" "+m1+" "+m2);
    switch(m0 >> 4) {
      case 0x9: // note ON
        console.log(" ON key="+m1+" vel="+m2);
        break;

      case 0x8: // note OFF
        console.log("OFF key="+m1);
        break;
    }

}

requestButtonGN.addEventListener('click', function() {
	usbmidi_driver_init(0x09e8, 0x0076, midiEvent); // AKAI LPK25
});

disconnectButton.addEventListener('click', function() {
	usbmidi_driver_disconnect();
});





