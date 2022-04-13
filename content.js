//var Linkwindow = window.open({url:'video.html'}, "Commitment", "resizable,scrollbars,status");
  var link;

  chrome.storage.sync.get(['enabledDisabled'], function(data) {
      //checks if Enabled
      if (data.enabledDisabled === true){
            chrome.storage.sync.get(['mytext'], function(data) {
            //checks if link saved contained anything
            if (data.mytext === undefined || data.mytext === ""){
                var Linkwindow = window.open("https://www.dropbox.com/s/snaf5vw6uvjzgjn/melodyFinal.mp3?raw=1", "Commitment", "resizable,scrollbars,status");
            } else {
                link = data.mytext;
                var Linkwindow = window.open(link, "Commitment", "resizable,scrollbars,status");
            }
            });
      } else {
        //do nothing
      }

  });