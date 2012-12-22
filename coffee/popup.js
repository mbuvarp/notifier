// Generated by CoffeeScript 1.3.3
(function() {
  var $, chatterText, clickDinnerLink, createBusDataRequest, displayStories, fadeButtonText, findUpdatedPosts, insertBusInfo, iteration, listDinners, ls, mainLoop, optionsText, updateBus, updateCantinas, updateNews,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = jQuery;

  ls = localStorage;

  iteration = 0;

  mainLoop = function() {
    if (DEBUG) {
      console.log("\n#" + iteration);
    }
    if (iteration % UPDATE_CANTINAS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateCantinas();
    }
    if (iteration % UPDATE_BUS_INTERVAL === 0 && ls.showBus === 'true') {
      updateBus();
    }
    if (iteration % UPDATE_NEWS_INTERVAL === 0) {
      updateNews();
    }
    if (10000 < iteration) {
      iteration = 0;
    } else {
      iteration++;
    }
    return setTimeout((function() {
      return mainLoop();
    }), PAGE_LOOP);
  };

  updateCantinas = function() {
    var hangaren_rss, hangaren_url, realfag_rss, realfag_url;
    if (DEBUG) {
      console.log('updateCantinas');
    }
    hangaren_rss = 'http://sit.no/rss.ap?thisId=36444&ma=on&ti=on&on=on&to=on&fr=on';
    realfag_rss = 'http://sit.no/rss.ap?thisId=36447&ma=on&ti=on&on=on&to=on&fr=on';
    hangaren_url = 'http://sit.no/content/36444/Ukas-middagsmeny-pa-Hangaren';
    realfag_url = 'http://sit.no/content/36447/Ukas-middagsmeny-pa-Realfag';
    Cantina.get(hangaren_rss, function(menu) {
      $('#cantinas #hangaren #dinnerbox').html(listDinners(menu));
      return clickDinnerLink('#cantinas #hangaren #dinnerbox li', hangaren_url);
    });
    return Cantina.get(realfag_rss, function(menu) {
      $('#cantinas #realfag #dinnerbox').html(listDinners(menu));
      return clickDinnerLink('#cantinas #realfag #dinnerbox li', realfag_url);
    });
  };

  listDinners = function(menu) {
    var dinner, dinnerlist, _i, _len;
    dinnerlist = '';
    if (typeof menu === 'string') {
      ls.noDinnerInfo = 'true';
      dinnerlist += '<li>' + menu + '</li>';
    } else {
      ls.noDinnerInfo = 'false';
      for (_i = 0, _len = menu.length; _i < _len; _i++) {
        dinner = menu[_i];
        if (dinner.price !== null) {
          dinner.price = dinner.price + ',- ';
          dinnerlist += '<li id="' + dinner.index + '">' + dinner.price + dinner.text + '</li>';
        } else {
          dinnerlist += '<li class="message" id="' + dinner.index + '">- "' + dinner.text + '"</li>';
        }
      }
    }
    return dinnerlist;
  };

  clickDinnerLink = function(cssSelector, url) {
    return $(cssSelector).click(function() {
      var _id;
      _id = $(this).attr('id');
      ls.chosenDinner = _id;
      chrome.tabs.create({
        url: url
      });
      return window.close();
    });
  };

  updateBus = function() {
    if (DEBUG) {
      console.log('updateBus');
    }
    if (!navigator.onLine) {
      $('#bus #first_bus .name').html(ls.first_bus_name);
      $('#bus #second_bus .name').html(ls.second_bus_name);
      $('#bus #first_bus .first .line').html('Frakoblet fra api.visuweb.no');
      return $('#bus #second_bus .first .line').html('Frakoblet fra api.visuweb.no');
    } else {
      createBusDataRequest('first_bus', '#first_bus');
      return createBusDataRequest('second_bus', '#second_bus');
    }
  };

  createBusDataRequest = function(bus, cssIdentificator) {
    var activeLines, amountOfLines;
    activeLines = ls[bus + '_active_lines'];
    if (activeLines !== void 0 && activeLines !== '') {
      activeLines = JSON.parse(activeLines);
      Bus.getFavoriteLines(ls[bus], activeLines, function(lines) {
        return insertBusInfo(lines, ls[bus + '_name'], cssIdentificator);
      });
    }
    if (activeLines === void 0 || activeLines === '') {
      amountOfLines = 3;
      return Bus.getAnyLines(ls[bus], amountOfLines, function(lines) {
        return insertBusInfo(lines, ls[bus + '_name'], cssIdentificator);
      });
    }
  };

  insertBusInfo = function(lines, stopName, cssIdentificator) {
    var busStop, counter, i, spans, _results;
    busStop = '#bus ' + cssIdentificator;
    if (typeof lines === 'string') {
      $(busStop + ' .name').html(stopName);
      $(busStop + ' .line').html('');
      $(busStop + ' .time').html('');
      return $(busStop + ' .first .line').html(lines);
    } else {
      $(busStop + ' .name').html(stopName);
      spans = ['.first', '.second', '.third'];
      counter = 0;
      if (lines['departures'].length === 0) {
        $(busStop + ' .line').html('');
        $(busStop + ' .time').html('');
        return $(busStop + ' ' + spans[0] + ' .line').html('<i>....zzzZZZzzz....</i>');
      } else {
        _results = [];
        for (i in lines['departures']) {
          $(busStop + ' ' + spans[counter] + ' .line').html(lines['destination'][i] + ' ');
          $(busStop + ' ' + spans[counter] + ' .time').html(lines['departures'][i]);
          _results.push(counter++);
        }
        return _results;
      }
    }
  };

  updateNews = function() {
    var response;
    if (DEBUG) {
      console.log('updateNews');
    }
    response = ls.lastResponseData;
    if (response !== void 0) {
      return displayStories(response);
    } else {
      return $('#news').append('<div class="post"><div class="title">Nyheter</div><div class="item">Frakoblet fra online.ntnu.no</div></div>');
    }
  };

  displayStories = function(xmlstring) {
    var $xml, idsOfLastViewed, index, items, updatedList, value, xmldoc, _guid, _mostRecent, _results, _text;
    xmldoc = $.parseXML(xmlstring);
    $xml = $(xmldoc);
    items = $xml.find("item");
    _guid = $(items[0]).find("guid");
    _text = $(_guid).text();
    _mostRecent = _text.split('/')[4];
    ls.mostRecentRead = _mostRecent;
    $('#news').html('');
    updatedList = findUpdatedPosts();
    idsOfLastViewed = [];
    items.each(function(index, element) {
      var item, post, _ref;
      if (index < 4) {
        post = parsePost(element);
        idsOfLastViewed.push(post.id);
        item = '<div class="post"><div class="title">';
        if (index < ls.unreadCount) {
          if (_ref = post.id, __indexOf.call(updatedList.indexOf, _ref) >= 0) {
            item += '<span class="unread">UPDATED <b>::</b> </span>';
          } else {
            item += '<span class="unread">NEW <b>::</b> </span>';
          }
        }
        item += post.title + '</div>\
          <div class="item" id="' + post.link + '">\
            <img id="' + post.id + '" src="' + post.image + '" width="107" />\
            <div class="textwrapper">\
              <div class="emphasized">- Av ' + post.creator + ', skrevet ' + post.date + '</div>\
              ' + post.description + '\
            </div>\
          </div>\
        </div>';
        return $('#news').append(item);
      }
    });
    ls.lastViewedIdList = JSON.stringify(idsOfLastViewed);
    chrome.browserAction.setBadgeText({
      text: ''
    });
    ls.unreadCount = 0;
    $('.item').click(function() {
      chrome.tabs.create({
        url: $(this).attr('id')
      });
      return window.close();
    });
    _results = [];
    for (index in idsOfLastViewed) {
      value = idsOfLastViewed[index];
      _results.push(getImageUrlForId(value, function(id, image) {
        return $('img[id=' + id + ']').attr('src', image);
      }));
    }
    return _results;
  };

  findUpdatedPosts = function() {
    var news, newsList, updatedList, viewed, viewedList, _i, _j, _len, _len1;
    if (ls.lastViewedIdList === void 0) {
      ls.lastViewedIdList = JSON.stringify([]);
      return [];
    } else if (ls.mostRecentIdList === void 0) {
      ls.mostRecentIdList = JSON.stringify([]);
      return [];
    } else {
      viewedList = JSON.parse(ls.lastViewedIdList);
      newsList = JSON.parse(ls.mostRecentIdList);
      updatedList = [];
      for (_i = 0, _len = viewedList.length; _i < _len; _i++) {
        viewed = viewedList[_i];
        for (_j = 0, _len1 = newsList.length; _j < _len1; _j++) {
          news = newsList[_j];
          if (viewedList[viewed] === newsList[news]) {
            updatedList.push(viewedList[viewed]);
          }
        }
      }
      return updatedList;
    }
  };

  optionsText = function(show) {
    return fadeButtonText(show, 'Innstillinger');
  };

  chatterText = function(show) {
    return fadeButtonText(show, '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Bli med i samtalen');
  };

  fadeButtonText = function(show, msg) {
    var fadeInSpeed, fadeOutSpeed;
    fadeInSpeed = 150;
    fadeOutSpeed = 50;
    if (show) {
      $('#buttontext').html(msg);
      return $('#buttontext').fadeIn(fadeInSpeed);
    } else {
      $('#buttontext').fadeOut(fadeOutSpeed);
      return $('#buttontext').html('');
    }
  };

  $(function() {
    if (ls.useInfoscreen === 'true') {
      chrome.tabs.create({
        url: 'infoscreen.html'
      });
      setTimeout((function() {
        return window.close();
      }), 250);
    }
    if (ls.showCantina !== 'true') {
      $('#cantinas').hide();
    }
    if (ls.showBus !== 'true') {
      $('#bus').hide();
    }
    $('#logo').click(function() {
      chrome.tabs.create({
        url: EXTENSION_WEBSITE
      });
      return window.close();
    });
    $('#options_button').click(function() {
      chrome.tabs.create({
        url: 'options.html'
      });
      return window.close();
    });
    $('#chatter_button').click(function() {
      chrome.tabs.create({
        url: 'http://webchat.freenode.net/?channels=online'
      });
      return window.close();
    });
    $('#options_button').mouseenter(function() {
      return optionsText(true);
    });
    $('#options_button').mouseleave(function() {
      return optionsText(false);
    });
    $('#chatter_button').mouseenter(function() {
      return chatterText(true);
    });
    $('#chatter_button').mouseleave(function() {
      return chatterText(false);
    });
    $('#bus #atb_logo').click(function() {
      chrome.tabs.create({
        url: 'http://www.atb.no'
      });
      return window.close();
    });
    return mainLoop();
  });

}).call(this);
