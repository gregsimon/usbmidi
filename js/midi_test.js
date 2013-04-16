


var requestButtonGN = document.getElementById("requestPermissionGN");
var disconnectButton = document.getElementById("disconnect");

var audioContext;

var oscillator; //  synth
var gainNode; // for velocity

var freqMap;

function midiEvent(cin, m0, m1, m2) {
    //console.log(cin+" "+m0+" "+m1+" "+m2);
    switch(m0 >> 4) {
      case 0x9: // note ON
      	{
      		var f = keyToFreq(m1);
      		oscillator.notOff && oscillator.notOff(0);
      		oscillator.frequency.value = f;
      		oscillator.noteOn && oscillator.noteOn(0);
        	console.log(" ON key="+m1+" vel="+m2+"  freq="+f);

        }
        break;

      case 0x8: // note OFF
      	{
      		oscillator.noteOff && oscillator.noteOff(0);
        	console.log("OFF key="+m1);
        }
        break;
    }
}

requestButtonGN.addEventListener('click', function() {
	usbmidi_driver_init(0x09e8, 0x0076, midiEvent); // AKAI LPK25

	// start the audio context
	audioContext = new webkitAudioContext();//webkit browsers only
	oscillator = audioContext.createOscillator();

	gainNode = audioContext.createGainNode();  
	oscillator.connect(gainNode);  
	gainNode.connect(audioContext.destination); 
	gainNode.gain.value = 1.0;
	oscillator.type = 0; // sine wave

    // build the frequency map.
	var freqs = [ 
		48, 130.81,
		49,	138.59,
		50,	146.83,
	 	51,	155.56,
		52,	164.81,
		53,	174.61,
	 	54,	184.99,
		55,	195.99,
		56,	207.65,
		57,	220.00,
		58,	233.08,
		59,	246.94,
	 	60,	261.63,
		61,	277.18,
		62,	293.66,
	 	63,	311.13,
		64,	329.63,
	 	65,	349.23,
	 	66,	369.99,
		67,	391.99,
		68,	415.31,
		69,	440.00,
		70,	466.16,
	 	71,	439.88,
		72,	523.25,
		];

	freqMap = new Array();
	for (var i=0; i<freqs.length; i+=2) {
		freqMap[freqs[i]] = freqs[i+1];
	}

	


});

disconnectButton.addEventListener('click', function() {
	usbmidi_driver_disconnect();
});

function keyToFreq(key) {
	return freqMap[key];
}



