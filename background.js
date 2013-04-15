
chrome.app.runtime.onLaunched.addListener(function() { 
  // Tell your app what to launch and how.
  chrome.app.window.create('main.html', {
    width: 640,
    height: 880,
    minWidth: 640,
    minHeight: 480,
    left: 0,
    top: 0,
    type: 'shell'
  });

});
