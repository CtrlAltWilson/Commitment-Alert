//show saved hyperlink
function CurrentLink () {
chrome.storage.sync.get(['mytext'], function(data) {

    var c = document.createElement('div');
    var linkMessage = document.getElementById("linkM") ;

    if (data.mytext === undefined || data.mytext === ""){

        linkMessage.innerHTML = 'Current Link:' + "<br>" + "Default Sound";
        //document.getElementsByTagName('body')[0].appendChild(c);  //<<< append the element to the pages body
    } else {
        linkMessage.innerHTML = 'Current Link:' + "<br>" + data.mytext;
        //document.getElementsByTagName('body')[0].appendChild(c);  //<<< append the element to the pages body
    }
});
}

function SavedLink(){
    var strMessage1 = document.getElementById("Saved") ;

    strMessage1.innerHTML = "Saved!";
    setTimeout(function () {
        strMessage1.innerHTML = "";
    }, 1000);
}

///////////////////
CurrentLink();
//////////////////

//save button
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('button[type="submit"]').addEventListener('click', onclick, false)
    function onclick () {

        //grabs the value from the textbox
        var clickYT = document.getElementById("YTlink").value;

        //check to see if link entered is blank
        if (clickYT.trim() === ""){

            var b = document.createElement('div');

            b.innerHTML = "Nothing was typed!";
            document.getElementsByTagName('body')[0].appendChild(b);  //<<< append the element to the pages body
        } else {

            var clickYTTRIM = clickYT.trim();

            //chrome.storage.sync.clear();

            //setting link
            chrome.storage.sync.set({ mytext: clickYTTRIM }, function(){
                console.log('Value is set to ' + clickYTTRIM)
            });

            //show saved after save button is clicked
            SavedLink();
            CurrentLink();
        }
    }
}, false)

//default button
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('button[type="default"]').addEventListener('click', onclick, false)
    function onclick () {

            //chrome.storage.sync.clear();
            chrome.storage.sync.set({ mytext: "" }, function() {})
            SavedLink();
            CurrentLink();

    }
}, false)

