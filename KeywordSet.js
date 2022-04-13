var highlighterEnabled = true;
var debug= false;

HighlightsData=({
                	"Groups":{
                		"chat test":{
                			"Color":"",
                			"Fcolor":"",
                			"Enabled":true,
                			"ShowOn":[],
                			"DontShowOn":[],
                			"FindWords":true,
                			"Type":"local",
                			"ShowInEditableFields":false,
                			"NotifyOnHighlight":false,
                			"NotifyFrequency":"1",
                			"storage":"local",
                			"regexTokens":false,
                			"caseSensitive":false,
                			//"Modified":1614282896021,
                			"action":{
                				"type":"1",
                			},
                			//"Words":["Available"]
                			"Words":["There is a chat contact waiting. Do you want to accept it"]
                		}
                	}
                });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.command=="getWords") {
      sendResponse({words:getWords(request.url)});
    }
    if(request.command=="getStatus") {
      sendResponse({status:highlighterEnabled, config:getConfig()});
    }
    return true;
});


function getGroups(inData, inUrl, inResults){
    var groupsForUrl=inResults;
    try {

        for (var highlightData in inData.Groups) {
            var returnHighlight=false;
            if (inData.Groups[highlightData].Enabled){
                if (inUrl==''||inData.Groups[highlightData].ShowOn.length==0){
                    returnHighlight=true;
                }
                if(returnHighlight){groupsForUrl[highlightData]=inData.Groups[highlightData];}
            }
        }
    }
    catch {
        log('error in getting groups', inData, inUrl, inResults);
    }
    return groupsForUrl;
}
function getWords(inUrl){

    groupsForUrl=getGroups(HighlightsData, inUrl,[]);

    var wordsForUrl={words:{},regex:{}};

    //now let's calculate the regex and worlist
    wordsForUrl.words=transformWordsToWordList(groupsForUrl);
    wordsForUrl.regex=transformWordsToRegex(wordsForUrl.words);
    //alert(wordsForUrl.);
    return wordsForUrl;
}



function transformWordsToWordList(words){
    var wordsArray=[];
    var regexFindBackAgainstContent=/\(\?\=|\(\?\!|\(\?\<\=|\(\?\<\!/gi;

    for (group in words) {
        if (words[group].Enabled) {
            for (word in words[group].Words) {
                var findBackAgainstContent=false;
                if( words[group].Words[word].trim()!==''){
                    if(words[group].regexTokens){
                        var regex=words[group].Words[word];
                        if(words[group].Words[word].match(regexFindBackAgainstContent)){findBackAgainstContent=true;}
                    }
                    else{
                        var regex=globStringToRegex(words[group].Words[word]);
                    }

                    var action=words[group].action||{type:0};

                    wordsArray.push( {
                        "regex": regex,
                        "Color": words[group].Color,
                        "Fcolor": words[group].FColor,
                        "action": action
                    });
                }
            }
        }
    }
    //alert(wordsArray);
    return wordsArray
}
function transformWordsToRegex(input){
    var words = "";
    var wordparts = "";
    var wordsEditable = "";
    var wordpartsEditable = "";

    var wordsCS = "";
    var wordpartsCS = "";
    var wordsEditableCS = "";
    var wordpartsEditableCS = "";

    //reverse sort the keys based on length
    var sortedKeys = input.sort(function (a, b) {
        return b.word.length - a.word.length;
    });

    input.map(function(x){return x.word})

    for (word in sortedKeys) {
        if (sortedKeys[word].FindWords) {
            if(sortedKeys[word].caseSensitive){
                wordsCS += sortedKeys[word].regex + "|";
                if (sortedKeys[word].ShowInEditableFields) {
                    wordsEditableCS += sortedKeys[word].regex + "|";
                }
            }
            else {
                words += sortedKeys[word].regex + "|";
                if (sortedKeys[word].ShowInEditableFields) {
                    wordsEditable += sortedKeys[word].regex + "|";
                }
            }
        }
        else {
            if(sortedKeys[word].caseSensitive){
                wordpartsCS += sortedKeys[word].regex + "|";
                if (sortedKeys[word].ShowInEditableFields) {
                    wordpartsEditableCS += sortedKeys[word].regex + "|";
                }
            }
            else {
                wordparts += sortedKeys[word].regex + "|";
                if (sortedKeys[word].ShowInEditableFields) {
                    wordpartsEditable += sortedKeys[word].regex + "|";
                }
            }
        }

    }
    //regex for all words non case sensitive
    var re = "";
    if (words.length > 1) {
        words = words.substring(0, words.length - 1);
        re += "(" + words + ")";
        re = "\\b" + re + "\\b" + "|\\s" + re + "\\s";
    }
    if (wordparts.length > 1 && words.length > 1) {
        re += "|";
    }
    if (wordparts.length > 1) {
        wordparts = wordparts.substring(0, wordparts.length - 1);
        re += "(" + wordparts + ")";
    }
    matchRegex = re;

    //regex for all words  case sensitive
    var re = "";
    if (wordsCS.length > 1) {
        wordsCS = wordsCS.substring(0, wordsCS.length - 1);
        re += "(" + wordsCS + ")";
        re = "\\b" + re + "\\b" + "|\\s" + re + "\\s";
    }
    if (wordpartsCS.length > 1 && wordsCS.length > 1) {
        re += "|";
    }
    if (wordpartsCS.length > 1) {
        wordpartsCS = wordpartsCS.substring(0, wordpartsCS.length - 1);
        re += "(" + wordpartsCS + ")";
    }
    matchRegexCS = re;

    //ContentEditable regex non case sensitive
    var re = "";
    if (wordsEditable.length > 1) {
        wordsEditable = wordsEditable.substring(0, wordsEditable.length - 1);
        re += "(" + wordsEditable + ")";
        re = "\\b" + re + "\\b" + "|\\s" + re + "\\s";
    }

    if (wordpartsEditable.length > 1 && wordsEditable.length > 1) {
        re += "|";
    }

    if (wordpartsEditable.length > 1) {
        wordpartsEditable = wordpartsEditable.substring(0, wordpartsEditable.length - 1);
        re += "(" + wordpartsEditable + ")";
    }
    matchRegexEditable = re;

    //ContentEditable regex case sensitive
    var re = "";
    if (wordsEditableCS.length > 1) {
        wordsEditableCS = wordsEditableCS.substring(0, wordsEditableCS.length - 1);
        re += "(" + wordsEditableCS + ")";
        re = "\\b" + re + "\\b" + "|\\s" + re + "\\s";
    }

    if (wordpartsEditableCS.length > 1 && wordsEditableCS.length > 1) {
        re += "|";
    }

    if (wordpartsEditableCS.length > 1) {
        wordpartsEditableCS = wordpartsEditableCS.substring(0, wordpartsEditableCS.length - 1);
        re += "(" + wordpartsEditableCS + ")";
    }
    matchRegexEditableCS = re;
    var doMatchRegex=matchRegex.length>0;
    var doMatchRegexCS=matchRegexCS.length>0;
    var domatchRegexEditable=matchRegexEditable.length>0;
    var domatchRegexEditableCS=matchRegexEditableCS.length>0;

    return {matchRegex: matchRegex,matchRegexCS: matchRegexCS, matchRegexEditable: matchRegexEditable, matchRegexEditableCS: matchRegexEditableCS,doMatchRegex:doMatchRegex, doMatchRegexCS:doMatchRegexCS, domatchRegexEditable:domatchRegexEditable,domatchRegexEditableCS:domatchRegexEditableCS};
}

function globStringToRegex(str) {
    str=str.replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&");
    return preg_quote(str).replace(/\*/g, '\S*').replace(/\\\?/g, '.');
}

function preg_quote (str,delimiter) {
    return (str + '').replace(new RegExp('/^.*[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-].*$/', 'g'), '\\$&');
}

function getConfig(){
        return {
            highlightLoopFrequency: 500,
            fixedLoopTime: false,
            increaseLoop: 250,
            decreaseLoop: 125,
            maxLoopTime: 2500,
            minLoopTime: 500,
            highlightAtStart: true,
            updateOnDomChange: true
        };
}

function skipSelectorsForUrl(inUrl){
    return skipSelectors.join(', ');
}