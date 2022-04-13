//Enable at install
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.storage.sync.set({
            'enabledDisabled': true
        }, function() {});
    }
});

//checks saved E/D then set checkbox
function EDCheck(){
    chrome.storage.sync.get(['enabledDisabled'], function(data) {
        var codeword;
        if(data.enabledDisabled === true){
            document.getElementById("enabledDisabled").checked = true;
            //codeword = " it is set to on";
        } else if (data.enabledDisabled === false) {
            document.getElementById("enabledDisabled").checked = false;
            //codeword = " it is set to off";
        }
        //var b = document.createElement('div');
        //b.innerHTML = data.enabledDisabled + codeword;
        //document.getElementsByTagName('body')[0].appendChild(b);  //<<< append the element to the pages body
    });
}

///////////////
EDCheck();
///////////////

//sets E/D on click
document.addEventListener('DOMContentLoaded', function () {

    var checkbox = document.querySelector("input[name=onoffswitch]");

    checkbox.addEventListener('change', function(){

    if (this.checked){
        //var b = document.createElement('div');
        //b.innerHTML = "ITS ON";
        //document.getElementsByTagName('body')[0].appendChild(b);  //<<< append the element to the pages body
        chrome.storage.sync.set({ 'enabledDisabled': true }, function() {})

     } else{
         //var b = document.createElement('div');
         //b.innerHTML = "ITS OFF";
         //document.getElementsByTagName('body')[0].appendChild(b);  //<<< append the element to the pages body
         chrome.storage.sync.set({ 'enabledDisabled': false }, function() {})
     }

     EDCheck();

    })
}, false)