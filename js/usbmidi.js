

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

function usbmidi_driver_disconnect() {
  chrome.usb.closeDevice(usbDevice.device);
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


  // Connected. Grab the device descriptor so we know what
  // ports, etc are on this device.
  chrome.usb.controlTransfer(usbDevice.device,
      { direction:'in',
        recipient:'device',   // device, interface, endpoint, other
         requestType:'standard',  // standard, class, vendor, reserved
         request:0x6, //  "GET_DESCRIPTOR"
         value:0x100, // 0x0100 device descriptor
         index:0,  // 0x0000
        length:64 // 18 bytes
      }, function(e) {
        usbDevice.device_desciptor = e.data;
        console.log("DEVICE Descriptor:");
        dump_hex(e.data);

        var dv = new DataView(e.data);
        usbDevice.numConfigs = dv.getUint8(17);
        usbDevice.maxPacketSize = dv.getUint8(7);
        console.log(usbDevice.numConfigs+" configuration(s)");

        // now read the configuration (TODO there may be more than one!)
        chrome.usb.controlTransfer(usbDevice.device,
        { direction:'in',
          recipient:'device',   // device, interface, endpoint, other
           requestType:'standard',  // standard, class, vendor, reserved
           request:0x06, //  "GET_CONFIGURATION"
           value:0x200, //  configuration
           index:0,  // 0x0000
          length:64 //  bytes ?
        }, function(e) {
          usbDevice.config_descriptor = e.data;
          console.log("Configuration descriptor:");
          dump_hex(e.data);

          var dv = new DataView(e.data);
          usbDevice.numInterfaces = dv.getUint8(4);
          usbDevice.configValue = dv.getUint8(5);
          console.log(usbDevice.numInterfaces +
                " interfaces available! this config # is "+usbDevice.configValue);

/*
          usbDevice.interfaces = new Array();
          for (var i=0; i<usbDevice.numInterfaces; ++i) {

            chrome.usb.controlTransfer(usbDevice.device,
              { direction:'in',
                recipient:'interface',   // device, interface, endpoint, other
                 requestType:'standard',  // standard, class, vendor, reserved
                 request:0x40, // "GET_INTERFACE"
                 value:0, //
                 index:i,  // interface index
                length:1 //  bytes ?
              }, function(num) { return function(e) {
                usbDevice.interfaces[num] = e.data;
                console.log("Interface "+num+" descriptor:");
                dump_hex(usbDevice.interfaces[num]);

                //var dv = new DataView(e.data);
              }
              }(i) );

          } // end for
          */


          chrome.usb.claimInterface(usbDevice.device, 0x1, function() {
            console.log(" CLAIM INTERFACE...");
            listen_next_packet();
          });


/*
          // now select configuration #1
          // 0x09
          chrome.usb.controlTransfer(usbDevice.device,
                { direction:'in',
                  recipient:'device',   // device, interface, endpoint, other
                   requestType:'standard',  // standard, class, vendor, reserved
                   request:0x06, // 0x09 "SET_CONFIGURATION"
                   value:1, // 1 configuration value
                   index:0,  // 0x0000
                  length:64 // 18 bytes ?
                }, function(e) {
                  //usbDevice.device_desciptor = e.data;
                  console.log("SET_CONFIGURATION descriptor:");
                  dump_hex(e.data);
                  listen_next_packet();
                });
*/


        });
      });


}

function listen_next_packet() {

  // Listen for next Packet. MIDI packets are 32-bit bulk transfers.
  // MIDI send 64 byte minimum bulk xfer packet sizes.
  chrome.usb.bulkTransfer(usbDevice.device,
    {direction:'in', endpoint:ep_in, length:64}, function(e) {
      console.log("***** GOT "+e.data.byteLength+" bytes!");

      listen_next_packet();
    });
}


function dump_hex(data) {
  var bv = new DataView(data);
  var s = "";
  for (i=0; i<data.byteLength; ++i) {
    s += (d2h(bv.getUint8(i)) + " ");
  }
  console.log(s);
  return s;
}

function d2h(d) {
  var hex = Number(d).toString(16);
  hex = "000000".substr(0, 2 - hex.length) + hex;
  return hex;
}
