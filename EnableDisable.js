//checks saved E/D then set checkbox
function EDCheck()
{
    chrome.storage.sync.get(['enabledDisabled'], function(data)
    {
        var codeword;

        if(data.enabledDisabled === true)
        {
            document.getElementById("enabledDisabled").checked = true;
            //codeword = " it is set to on";
        } else if (data.enabledDisabled === false)
        {
            document.getElementById("enabledDisabled").checked = false;
            //codeword = " it is set to off";
        }
    });
}

///////////////
EDCheck();
///////////////

//sets E/D on click
document.addEventListener('DOMContentLoaded', function ()
{
    var checkbox = document.querySelector("input[name=onoffswitch]");

    checkbox.addEventListener('change', function()
    {
        if (this.checked)
        {
            chrome.storage.sync.set({ 'enabledDisabled': true }, function() {})
        } else
        {
            chrome.storage.sync.set({ 'enabledDisabled': false }, function() {})
        }
        EDCheck();
    })
}, false)