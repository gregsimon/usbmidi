


var requestButtonGN = document.getElementById("requestPermissionGN");
var note_info = document.getElementById('note_info');
var raw = [ document.getElementById('raw0'),
			document.getElementById('raw1'),
			document.getElementById('raw2'),
			document.getElementById('raw3')];


var audioContext;
var freqMap;
var synth_oscillator_type = 'square';

var activeNotes = new Object();

function midiEvent(cin, m0, m1, m2) {
    //console.log(cin+" "+m0+" "+m1+" "+m2);

    for (var i=raw.length-1; i>0; i--) {
    	raw[i].innerText = raw[i-1].innerText;
    }

    raw[0].innerText = "RAW " + (d2h(cin)+" "+
    					d2h(m0)+" "+
    					d2h(m1)+" "+
    					d2h(m2));
    switch(m0 >> 4) {
      case 0x9: // note ON
      	{
      		var f = keyToFreq(m1);

      		// does an oscillator already exist for this note?
      		var oscillator = activeNotes[m1];
      		if (oscillator != undefined) {
      			oscillator.noteOff && oscillator.noteOff(0);
      		}

      		// create a new oscillator
      		var oscillator = audioContext.createOscillator();
			var gainNode = audioContext.createGainNode();
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			gainNode.gain.value = m2 / 127.0;
			oscillator.type = synth_oscillator_type;
      		oscillator.frequency.value = f;
      		oscillator.noteOn && oscillator.noteOn(0);
      		activeNotes[m1] = oscillator;
        	note_info.innerText = (" key:"+m1+"  "+f+" Hz  velocity:"+m2+"/127");

        }
        break;

      case 0x8: // note OFF
      	{
      		var oscillator = activeNotes[m1];
      		if (oscillator != undefined) {
      			oscillator.noteOff && oscillator.noteOff(0);
      			activeNotes[m1] = undefined;
      		}
        	//console.log("OFF key="+m1);
        }
        break;

        default:
        	console.log("Unhandled MIDI event.");
    }
}

requestButtonGN.addEventListener('click', function() {

	usbmidi_driver_init(0x09e8, 0x0076, midiEvent); // AKAI LPK25
	audioContext = new webkitAudioContext();

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

function keyToFreq(key) {
	return freqMap[key];
}



