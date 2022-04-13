//Version Check
var version = document.getElementById("versionCheck");
version.innerHTML = "v" + chrome.runtime.getManifest().version;

//show saved hyperlink
function CurrentLink() {
    chrome.storage.sync.get(['mytext', 'chat_mytext'], function(data) {
        eraseText();
        var linkMessage = document.getElementById("linkM");

        if (data.mytext === undefined || data.mytext === "") {
            linkMessage.innerHTML = "<a href=\"" + chrome.runtime.getURL("melodyFinal.mp3") + "\" target=\"_blank\" style=\"color: #696969;\"> Default Sound </a>";
            //document.getElementsByTagName('body')[0].appendChild(c);  //<<< append the element to the pages body
            $('#x').hide();
            document.getElementById("linkM").style.margin = "0px 50px 0 50px";
        } else {
            var stripped_link = domain_from_url(data.mytext);
            linkMessage.innerHTML = "<a href=\"" + data.mytext + "\" target=\"_blank\" style=\"color: #696969;\">" + stripped_link + "</a>";
            //document.getElementsByTagName('body')[0].appendChild(c);  //<<< append the element to the pages body
            $('#x').show();
            document.getElementById("linkM").style.margin = "0px 0px 0 50px";
        }
        var chat_linkMessage = document.getElementById("chat_linkM");

        if (data.chat_mytext === undefined || data.chat_mytext === "") {
            chat_linkMessage.innerHTML = "<a href=\"" + chrome.runtime.getURL("chat_melody.mp3") + "\" target=\"_blank\" style=\"color: #696969;\"> Default Sound </a>";
            //document.getElementsByTagName('body')[0].appendChild(c);  //<<< append the element to the pages body
            $('#chat_x').hide();
            document.getElementById("chat_linkM").style.margin = "0px 50px 0 50px";
        } else {
            var stripped_chat_link = domain_from_url(data.chat_mytext);
            chat_linkMessage.innerHTML = "<a href=\"" + data.chat_mytext + "\" target=\"_blank\" style=\"color: #696969;\">" + stripped_chat_link + "</a>";
            //document.getElementsByTagName('body')[0].appendChild(c);  //<<< append the element to the pages body
            $('#chat_x').show();
            document.getElementById("chat_linkM").style.margin = "0px 0px 0 50px";
        }
    });
}

function SavedLink() {
    var strMessage1 = document.getElementById("Saved");

    strMessage1.innerHTML = "Saved!";
    setTimeout(function() {
        strMessage1.innerHTML = "";
    }, 1000);
}

///////////////////
CurrentLink();
//////////////////

//save button
//this can be optimized
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('button[type="submit"]').addEventListener('click', onclick, false)

    function onclick() {

        //grabs the value from the textbox
        var clickYT = document.getElementById("YTlink").value;
        var chat_clickYT = document.getElementById("Chat_YTlink").value;
        //check to see if link entered is blank
        if (clickYT.trim() === "" && chat_clickYT.trim() === "") {
            //var b = document.createElement('div');
            var b = document.getElementById("Saved");

            b.innerHTML = "Nothing was typed!";
            document.getElementsByTagName('body')[0].appendChild(b); //<<< append the element to the pages body
            setTimeout(function() {
                b.innerHTML = "";
            }, 1000);

        } else if (clickYT.trim() != "" && chat_clickYT.trim() === "") {
            var clickYTTRIM = clickYT.trim();

            //setting link
            chrome.storage.sync.set({
                mytext: clickYTTRIM
            }, function() {
                console.log('Value is set to ' + clickYTTRIM);
            });

            //show saved after save button is clicked
            SavedLink();
            CurrentLink();
        } else if (clickYT.trim() === "" && chat_clickYT.trim() != "") {
            var chat_clickYTTRIM = chat_clickYT.trim();

            //Chat setting link
            chrome.storage.sync.set({
                chat_mytext: chat_clickYTTRIM
            }, function() {
                console.log('Chat value is set to ' + chat_clickYTTRIM);
            });

            //show saved after save button is clicked
            SavedLink();
            CurrentLink();
        } else if (clickYT.trim() != "" && chat_clickYT.trim() != "") {
            var chat_clickYTTRIM = chat_clickYT.trim();
            var clickYTTRIM = clickYT.trim();

            //setting link
            chrome.storage.sync.set({
                mytext: clickYTTRIM
            }, function() {
                console.log('Value is set to ' + clickYTTRIM);
            });

            //chat setting link
            chrome.storage.sync.set({
                chat_mytext: chat_clickYTTRIM
            }, function() {
                console.log('Value is set to ' + chat_clickYTTRIM);
                console.log('Chat value is set to ' + chat_clickYTTRIM);
            });

            //show saved after save button is clicked
            SavedLink();
            CurrentLink();
        }
    }
}, false)

//default button
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('button[type="default"]').addEventListener('click', onclick, false)

    function onclick() {
        //chrome.storage.sync.clear();
        chrome.storage.sync.set({
            mytext: ""
        }, function() {})
        chrome.storage.sync.set({
            chat_mytext: ""
        }, function() {})
        SavedLink();
        CurrentLink();
    }
}, false)


//collapsible version button
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}


document.addEventListener('DOMContentLoaded', function() {
    var links = document.getElementsByTagName("plug");
    for (var i = 0; i < links.length; i++) {
        (function() {
            var ln = links[i];
            var location = ln.href;
            ln.onclick = function() {
                chrome.tabs.create({
                    active: true,
                    url: location
                });
            };
        })();
    }
});

//Link settings
$(document).ready(function() {
    var showSettings = 1;
    //On click for Link Settings
    $("#settings").click(function() {
        if (showSettings === 1) {
            $("#link_settings").slideDown();
            showSettings = 0;
        } else {
            $("#link_settings").slideUp();
            showSettings = 1;
        }
    });
});

function eraseText() {
    document.getElementById("YTlink").value = "";
    document.getElementById("Chat_YTlink").value = "";
}

//x button
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('button[class="x"]').addEventListener('click', onclick, false)

    function onclick() {
        //chrome.storage.sync.clear();
        chrome.storage.sync.set({
            mytext: ""
        }, function() {})
        SavedLink();
        CurrentLink();
    }
}, false)

//chat x button
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('button[class="chat_x"]').addEventListener('click', onclick, false)

    function onclick() {
        //chrome.storage.sync.clear();
        chrome.storage.sync.set({
            chat_mytext: ""
        }, function() {})
        SavedLink();
        CurrentLink();
    }
}, false)

function domain_from_url(url) {
    var result
    var match
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[1]
        }
    }
    return result
}