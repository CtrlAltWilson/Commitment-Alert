var link;

function launchLink(route) //1 = commitment, 0 = chat
{
    chrome.storage.sync.get([
        'enabledDisabled',
        'mytext',
        'chat_mytext',
        'endTime'
    ], function(data) {
        //checks if Enabled
        if (data.enabledDisabled === true) {
            //checks if link saved contained anything
            //30second delay
            var result = 0;
            var d = new Date();
            var startTime = d.getTime();

            if (data.endTime === undefined || data.endTime === "" || data.endTime < startTime) {
                chrome.storage.sync.set({
                    'endTime': startTime + 30000
                }, function() {})
                result = 1;
            }
            //alert(result + "time: " + data.endTime);
            if (result === 1) {
                if (route === 1) {
                    if (data.mytext === undefined || data.mytext === "") {
                        var defaultSound = chrome.runtime.getURL("melodyFinal.mp3");
                        var Linkwindow = window.open(defaultSound, "Commitment", "resizable,scrollbars,status");
                    } else {
                        link = data.mytext;
                        var Linkwindow = window.open(link, "Commitment", "resizable,scrollbars,status");
                    }
                } else if (route === 0) {
                    if (data.chat_mytext === undefined || data.chat_mytext === "") {
                        var defaultSound2 = chrome.runtime.getURL("chat_melody.mp3");
                        var Linkwindow = window.open(defaultSound2, "Chat", "resizable,scrollbars,status");
                    } else {
                        link = data.chat_mytext;
                        var Linkwindow = window.open(link, "Chat", "resizable,scrollbars,status");
                    }
                }
            }
        } else {
            //do nothing
        }
    });
}

//for commitments
if (window.location.href == "https://raptor--icagentconsole.na137.visual.force.com/apex/inContactCommitmentReminder?mode=Classic") {
    launchLink(1);
}

function HighlightEngine() {

    var highlightTag = "EM";
    var highlightClassname = "Highlight";
    var skipTags = new RegExp("^(?:SCRIPT|HEAD|NOSCRIPT|STYLE|TEXTAREA)$"); //TEXTAREA

    var highlights = {};
    var notifyAnyway = false;
    var highlightMarkers = {};
    var notifyForWords = new Set();


    // recursively apply word highlighting
    this.highlightWords = function(node, printHighlights, inContentEditable, loopNumber) {

        if (node == undefined || !node) return;
        if (node.nodeType === Node.ELEMENT_NODE && (skipTags.test(node.nodeName) || node.matches(SkipSelectors))) return;

        if (node.hasChildNodes()) {
            for (var i = 0; i < node.childNodes.length; i++) {
                this.highlightWords(node.childNodes[i], printHighlights, inContentEditable || node.isContentEditable, loopNumber);
            }
        }


        if (node.nodeType == 3) {
            //only act on text nodes
            var nv = node.nodeValue;
            if (nv.trim() != '') {
                if (!(node.parentElement.tagName == highlightTag && node.parentElement.className == highlightClassname)) {
                    //if we compare 2 regex's eg Case Sensity / Insensitive. Take the one with the lowest index from the exec, if equal take the longest string in [0]
                    if (inContentEditable) {
                        RegexConfig.doMatchRegexEditable ? (regs = matchRegexEditable.exec(nv)) : regs = undefined;
                        RegexConfig.doMatchRegexEditableCS ? (regsCS = matchRegexEditableCS.exec(nv)) : regsCS = undefined;
                    } else {
                        RegexConfig.doMatchRegex ? (regs = matchRegex.exec(nv)) : regs = undefined;
                        RegexConfig.doMatchRegexCS ? (regsCS = matchRegexCS.exec(nv)) : regsCS = undefined;
                    }

                    if (regs && regsCS) {
                        if (regs.index > regsCS.index || (regs.index == regsCS.index && regsCS[0].length > regs[0].length)) {
                            regs = regsCS
                        }
                    } else {
                        regs = regs || regsCS;
                    }

                    if (regs) {
                        var wordfound = "";

                        //find back the longest word that matches the found word
                        //TODO: this can be faster
                        for (word in wordColor) {
                            var pattern = new RegExp(wordColor[word].regex, wordColor[word].Matchtoken);
                            if ((!wordColor[word].findBackAgainstContent && pattern.test(regs[0]) || (wordColor[word].findBackAgainstContent && pattern.test(regs.input))) && word.length > wordfound.length) {

                                //if (pattern.test(regs.input) && word.length > wordfound.length) {
                                wordfound = word;
                                break;
                            }
                        }

                        if (wordColor[wordfound] != undefined) {
                            var match = document.createElement(highlightTag);
                            match.className = highlightClassname;
                            match.appendChild(document.createTextNode(regs[0]));
                            //THIS IS THE LINK REMEMBER
                            launchLink(0);
                            if (printHighlights) {
                                match.style = "padding: 1px;box-shadow: 1px 1px #e5e5e5;border-radius: 3px;-webkit-print-color-adjust:exact;";
                            } else {
                                match.style = "padding: 1px;box-shadow: 1px 1px #e5e5e5;border-radius: 3px;";
                            }

                            if (wordColor[wordfound].Color) {
                                match.style.backgroundColor = wordColor[wordfound].Color;
                            }
                            if (wordColor[wordfound].Fcolor) {
                                match.style.color = wordColor[wordfound].Fcolor;
                            }
                            match.setAttribute('match', wordColor[wordfound].word);
                            match.setAttribute('loopNumber', loopNumber);


                            match.style.fontStyle = "inherit";

                            if (!inContentEditable || (inContentEditable && wordColor[wordfound].ShowInEditableFields)) {
                                var after = node.splitText(regs.index);
                                after.nodeValue = after.nodeValue.substring(regs[0].length);
                                node.parentNode.insertBefore(match, after);
                            }

                            numberOfHighlights += 1;
                            highlights[wordfound] = highlights[wordfound] + 1 || 1;
                        }
                    }
                } else {
                    //text was already highlighted

                    if (node.parentElement.getAttribute('loopNumber') !== loopNumber.toString()) {
                        var nodeAttributes = this.findNodeAttributes(node.parentElement, {
                            "offset": 0,
                            "isInHidden": false
                        });

                        highlightMarkers[numberOfHighlights] = {
                            "word": node.parentElement.getAttribute('match'),
                            "offset": nodeAttributes.offset,
                            "hidden": nodeAttributes.isInHidden,
                            "color": wordColor.find(obj => obj.word === node.parentElement.getAttribute('match')).Color
                        };


                        numberOfHighlights += 1;
                        highlights[node.parentElement.getAttribute('match')] = highlights[node.parentElement.getAttribute('match')] + 1 || 1;
                    }
                }
            }
        }
    };

    this.findNodeAttributes = function(inNode, attributes) {
        attributes.offset += inNode.offsetTop;
        if (inNode.hidden || inNode.getAttribute("aria-hidden")) {
            attributes.isInHidden = true;
        }
        if (inNode.offsetParent) {
            return this.findNodeAttributes(inNode.offsetParent, attributes);

        }
        return attributes;
    }

    // start highlighting at target node
    this.highlight = function(words, printHighlights, regexConfig, skipSelectors, loopNumber) {
        wordColor = words;
        numberOfHighlights = 0;

        RegexConfig = regexConfig;

        matchRegex = new RegExp(regexConfig.matchRegex, "i");
        matchRegexCS = new RegExp(regexConfig.matchRegexCS, "");
        matchRegexEditable = new RegExp(regexConfig.matchRegexEditable, "i");
        matchRegexEditableCS = new RegExp(regexConfig.matchRegexEditableCS, "");
        SkipSelectors = skipSelectors;
        //replaceRegex = new RegExp(regexConfig.replaceRegex, "i");

        if (matchRegex || matchRegexEditable) {
            this.highlightWords(document.body, printHighlights, false, loopNumber);
        }
        return {
            numberOfHighlights: numberOfHighlights,
            details: highlights,
            markers: highlightMarkers,
            notify: Array.from(notifyForWords),
            notifyAnyway: notifyAnyway
        };
    };

}

var debug = false;


chrome.storage.sync.get(['enabledDisabled'], function(data) {
    //checks if Enabled
    if (data.enabledDisabled === true) {
        chrome.runtime.sendMessage({
            command: "getStatus"
        }, function(response) {
            debug && console.log('reponse from getStatus', window.location);
            highlighterEnabled = response.status;
            printHighlights = response.printHighlights;
            Config = response.config;
            Highlight = Config.highlightAtStart;
            HighlightLoopFrequency = Config.highlightLoopFrequency;
            debug && console.log('reponse from getStatus', Config);
            if (highlighterEnabled) {
                debug && console.log('about to get words', window.location);

                chrome.runtime.sendMessage({
                    command: "getWords",
                    url: location.href.replace(location.protocol + "//", "")
                }, function(response) {
                    debug && console.log('got words');
                    wordsArray = response.words.words;
                    regexConfig = response.words.regex;
                    skipSelectors = response.words.skipSelectors;
                    debug && console.log('processed words');
                    wordsReceived = true;

                    //start the highlight loop
                    var checker = setInterval(highlightLoop, 1000);
                });

            }
        });
    }
})

$(document).ready(function() {
    Highlight = true;

    debug && console.log('setup binding of dom sub tree modification');
    if (Config.updateOnDomChange) {
        //setup the mutationobjserver

        // select the target node
        var target = document.querySelector('body');

        // create an observer instance
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                debug && console.log(mutation);
            });
            debug && (debugStats.subTreeModCount += 1);
            Highlight = true;

        });

        // configuration of the observer:
        var config = {
            attributes: false,
            childList: true,
            characterData: true,
            subtree: true
        }

        // pass in the target node, as well as the observer options
        observer.observe(target, config);
    }
});


function highlightLoop() {

    ReadyToFindWords = true;
    debug && console.log("in loop", debugStats);
    if (Highlight) {
        findWords();
        //calucate new HighlightLoopFrequency
        if (!Config.fixedLoopTime && HighlightLoopFrequency < Config.maxLoopTime) {
            HighlightLoopFrequency += Config.increaseLoop;
        }
    } else {
        if (!Config.fixedLoopTime && HighlightLoopFrequency > Config.minLoopTime) {
            HighlightLoopFrequency -= Config.decreaseLoop;
        }
    }

    debug && (debugStats.loopCount += 1);
    debug && console.log("new loop frequency", HighlightLoopFrequency);

    HighlightLoop = setTimeout(function() {
        highlightLoop();
    }, HighlightLoopFrequency);

}




function findWords() {
    if (Object.keys(wordsArray).length > 0) {
        Highlight = false;

        debug && console.log('finding words', window.location);

        ReadyToFindWords = false;

        var changed = false;
        var myHilighter = new HighlightEngine();

        regexConfig.removeStrings = "";

        var loopNumber = Math.floor(Math.random() * 1000000000);
        var highlights = myHilighter.highlight(wordsArray, printHighlights, regexConfig, skipSelectors, loopNumber);
        if (highlights.numberOfHighlights > 0) {
            highlightMarkers = highlights.markers;
            markerPositions = [];
            for (marker in highlightMarkers) {
                if (markerPositions.indexOf(highlightMarkers[marker].offset) == -1) {
                    markerPositions.push(highlightMarkers[marker].offset);
                }
            }
            markerPositions.sort();

            chrome.runtime.sendMessage({
                command: "showHighlights",
                count: highlights.numberOfHighlights,
                url: document.location.href
            }, function(response) {});
        }
        debug && console.log('finished finding words');
        debug && (debugStats.findCount += 1);

        ReadyToFindWords = true;
    }

}