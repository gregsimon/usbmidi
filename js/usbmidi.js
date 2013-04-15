

console.log("USB MIDI Class Driver");

var usbDevice = null;  // "global" object for this driver.


// TODO : are these standard?
var ep_in  = 0x81;
var ep_out = 0x01;


var console_element = undefined;
function adb_log(str) {
  console.log(str);
  if (console_element != undefined)
    console_element.innerText += ("\n" + str);
}

function usbmidi_driver_init(vendorId, productId) {
  console_element = document.getElementById('console');
  // reset the state machines
  usbDevice = new Object();
  usbDevice.productId = productId;
  usbDevice.vendorId = vendorId;


  // attempt to connect a device.
  chrome.permissions.request(
      {permissions: [
          {'usbDevices': [{'vendorId': usbDevice.vendorId,
                "productId": usbDevice.productId}] }
       ]},
       function(result) {
        if (result) {
          adb_log('App was granted the "usbDevices" permission.');
          chrome.usb.findDevices(
              { "vendorId": usbDevice.vendorId,
                "productId": usbDevice.productId},
             usbmidi_driver_init2);
        } else {
          adb_log('App was NOT granted the "usbDevices" permission.');
        }
    });
}

function usbmidi_driver_init2(devices) {
  if (!devices || !devices.length) {
    adb_log("unable to find the device.");
    return;
  }

  // ok we got a device, set it up.
  adb_log(devices.length+" device(s) found, CONNECTED : productId=0x" +
        devices[0].productId.toString(16) +
        " vendorId=0x"+devices[0].vendorId.toString(16));
  usbDevice.device = devices[0];

  /* The standard interface descriptor characterizes the 
     interface itself, whereas the class-specific interface descriptor 
     provides pertinent information concerning the 
     internals of the USB-MIDI function. It specifies revision level 
     information and lists the capabilities of each 
     Jack and Element.
    */

/*
  // Connected. Grab the device descriptor so we know what
  // ports, etc are on this device.
  chrome.usb.controlTransfer(usbDevice.device, 
      { direction:'in', 
        recipient:'device',   // device, interface, endpoint, other
         requestType:'standard',  // standard, class, vendor, reserved
         request:0x6, // 0x06 "GET_DESCRIPTOR"
         value:0x100, // 0x0100 
         index:0,  // 0x0000 
        length:0x12 // 18 bytes
      }, function(e) {
        if (e.data.byteLength==18) {
          var bv = new DataView(e.data);
          s = "GET_DESCRIPTOR ";
          for (i=0; i<e.data.byteLength; ++i) {
            s += (bv.getUint8(i).toString(16) + " ");
          }
          console.log(s);

        }
      });
*/
/*
  chrome.usb.controlTransfer(usbDevice.device, 
      { direction:'in', 
        recipient:'interface',   // device, interface, endpoint, other
         requestType:'standard',  // standard, class, vendor, reserved
         request:0xa, // "GET_INTERFACE"
         value:0,
         index:0,
        length:18
      }, function(e) {
        //if (e.data.byteLength==18) {
          console.log("GET_INTERFACE "+e.data.byteLength);

        //}
          listen_next_packet();
      });

*/

  listen_next_packet();
  
}

function listen_next_packet() {
  // Listen for next Packet. MIDI packets are 32-bit bulk transfers.
/*
  chrome.usb.interruptTransfer(usbDevice.device,
    {direction:'in', endpoint:endpoint_out, length:4}, function(e) {
      console.log("GOT ... " + e.data.byteLength);

      listen_next_packet();
    });
  
  return;*/
  chrome.usb.bulkTransfer(usbDevice.device,
    {direction:'in', endpoint:ep_in, length:64}, function(e) {
      console.log("GOT "+e.data.byteLength+" bytes!");

      //listen_next_packet(); // ...
    });
}

function usbmidi_driver_init3() {
  console.log("usbmidi_driver_init3");
}

function usbmidi_driver_disconnect() {
  listen_next_packet();
}




/*
// This is called when a message has finished being sent.
// Use the SM to find out what to do next.
function adb_msg_sent() {
  adb_log("Starting to listen for a msg...");
  // actually, we'll just queue a listen here.
  chrome.usb.bulkTransfer(device.device,
    {direction:'in', endpoint:0x83, length:24}, function(uevent) {
      // we should have gotten the header.
      adb_log("Got header? r="+uevent.resultCode+" "+uevent.data.byteLength+" bytes)");

      // if we got less than 24 bytes, just bail
      if (uevent.data.byteLength != 24) {
        setTimeout(adb_msg_sent, 500);
        return;
      }

      // parse the header into a new message object
      var msg = adb_unpack_msg_header(uevent.data);

      adb_log(" payload is next, and should be "+msg.bodySize+" bytes");

      // now phase 2 -- receive the bulk transfer for the body.
      if (msg.bodySize > 0) {
        chrome.usb.bulkTransfer(device.device,
          {direction:'in', endpoint:0x83, length:msg.bodySize},
          function(uevent) {
            adb_log("payload got "+uevent.data.byteLength+" bytes  r="+uevent.resultCode);
            msg.body = uevent.data;
            adb_process_incoming_msg(msg);
          });

      } else {
        // this message is complete, send it for processing.
        adb_process_incoming_msg(msg);
      }
    });
}

// Pack up a message and queue it for sending.
function adb_queue_outgoing_msg(cmd, arg0, arg1, str) {
  var msg = adb_pack_msg(cmd, arg0, arg1, str);

  chrome.usb.bulkTransfer(device.device,
    {direction:'out', endpoint:0x03, data:msg.header}, function(ti) {
      adb_log("sent header, "+ti.resultCode+" "+msg.header.byteLength+" bytes");
      chrome.usb.bulkTransfer(device.device,
        {direction:'out', endpoint:0x03, data:msg.body}, function(ti2) {
          adb_log("sent body, "+ti2.resultCode+" "+msg.body.byteLength+" bytes");
          adb_msg_sent();
        })
    });

  //adb_log("msg packed, "+msg.header.byteLength+" bytes, "+msg.body.byteLength+" bytes");
}

function adb_unpack_msg_header(buffer) {
  var endian = true;
  var bv = new DataView(buffer);

  var m = {};
  m.cmd = bv.getUint32(0, endian);
  m.arg0 = bv.getUint32(4, endian);
  m.arg1 = bv.getUint32(8, endian);
  m.bodySize = bv.getUint32(12, endian);

  switch (m.cmd) {
    case A_SYNC: m.name = "SYNC"; break;
    case A_CNXN: m.name = "CNXN"; break;
    case A_OPEN: m.name = "OPEN"; break;
    case A_OKAY: m.name = "OKAY"; break;
    case A_CLSE: m.name = "CLSE"; break;
    case A_WRTE: m.name = "WRTE"; break;
    case A_AUTH: m.name = "AUTH"; break;
    default:
    m.name = "????";
  }

  adb_log("adb_unpack_msg_header: 0x"+m.cmd.toString(16)+
    "("+m.name+
    ") 0x"+m.arg0.toString(16)+
    " 0x"+m.arg1.toString(16)+
      "  payload that follows is "+m.bodySize+" bytes ...");

  return m;
}

function adb_pack_msg(cmd, arg0, arg1, str) {
  var m = {};

 // the string must be interpreted as a string of bytes.
  var dump_msg = false;

  if (dump_msg)
    adb_log(" ------ adb_pack_msg ------");

   var payloadBuf = new ArrayBuffer(str.length+1);
   var sbufView = new Uint8Array(payloadBuf);
   for (var i=0, strLen=str.length; i<strLen; i++) {
     sbufView[i] = str.charCodeAt(i);
   }
   sbufView[str.length] = 0; // null terminator
   var crc = crc32(str);

  if (dump_msg) {
    adb_log( "cmd=0x"+cmd.toString(16)+", 0x"+arg0.toString(16)+", 0x"+arg1.toString(16)+", \""+str+"\"");
    adb_log(" PACKED string is "+payloadBuf.byteLength+" bytes long  crc="+crc.toString(16)+" -> "+str);
  }

  var endian = true;
  var buffer = new ArrayBuffer(24);
  var bufferView = new DataView(buffer);
  bufferView.setUint32(0, cmd, endian);
  bufferView.setUint32(4, arg0, endian);
  bufferView.setUint32(8, arg1, endian);
  bufferView.setUint32(12, payloadBuf.byteLength, endian);
  bufferView.setUint32(16, crc, endian);
  bufferView.setUint32(20, (cmd ^ 0xffffffff), endian);

  if (dump_msg)
    adb_log(" PACKED len="+buffer.byteLength+"  checksum="+bufferView.getUint32(20, endian).toString(16));

  m.header = buffer;
  m.body = payloadBuf;

  return m;
}



// Crc32 utils ----------------------------------------------------------------------------

function Utf8Encode(string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
            utftext += String.fromCharCode(c);
        } else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        } else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }
    }
    return utftext;
};

function crc32 (str) {
    var s = Utf8Encode(str);
    var c = 0;
    for (i=0; i<s.length; i++) {
      c += s.charCodeAt(i);
    }
    return c;
};
*/


