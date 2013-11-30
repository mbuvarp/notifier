// Generated by CoffeeScript 1.4.0
(function() {
  var $, animateOracleAnswer, animateOracleQuestion, bindOracle, changeOracleAnswer, changeOracleQuestion, clearCookies, clickDinnerLink, clickHours, cookieText, cookieTextFinished, createBusDataRequest, displayItems, fadeButtonText, findUpdatedPosts, insertBusInfo, iteration, listDinners, ls, mainLoop, newsLimit, optionsText, oraclePrediction, tipsText, updateAffiliationNews, updateBus, updateCantinas, updateCoffee, updateHours, updateMeetings, updateServant,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = jQuery;

  ls = localStorage;

  iteration = 0;

  newsLimit = 4;

  mainLoop = function() {
    if (DEBUG) {
      console.log("\n#" + iteration);
    }
    if (Affiliation.org[ls.affiliationKey1].hardwareFeatures) {
      if (iteration % UPDATE_SERVANT_INTERVAL === 0 && ls.showOffice === 'true') {
        updateServant();
      }
      if (iteration % UPDATE_MEETINGS_INTERVAL === 0 && ls.showOffice === 'true') {
        updateMeetings();
      }
      if (iteration % UPDATE_COFFEE_INTERVAL === 0 && ls.showOffice === 'true') {
        updateCoffee();
      }
    }
    if (iteration % UPDATE_CANTINAS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateCantinas();
    }
    if (iteration % UPDATE_HOURS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateHours();
    }
    if (iteration % UPDATE_BUS_INTERVAL === 0 && ls.showBus === 'true') {
      updateBus();
    }
    if (iteration % UPDATE_NEWS_INTERVAL === 0 && ls.showAffiliation1 === 'true' && navigator.onLine) {
      updateAffiliationNews('1');
    }
    if (iteration % UPDATE_NEWS_INTERVAL === 0 && ls.showAffiliation2 === 'true' && navigator.onLine) {
      updateAffiliationNews('2');
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

  updateServant = function() {
    if (DEBUG) {
      console.log('updateServant');
    }
    return Servant.get(function(servant) {
      return $('#todays #schedule #servant').html('- ' + servant);
    });
  };

  updateMeetings = function() {
    if (DEBUG) {
      console.log('updateMeetings');
    }
    return Meetings.get(function(meetings) {
      meetings = meetings.replace(/\n/g, '<br />');
      return $('#todays #schedule #meetings').html(meetings);
    });
  };

  updateCoffee = function() {
    if (DEBUG) {
      console.log('updateCoffee');
    }
    return Coffee.get(true, function(pots, age) {
      $('#todays #coffee #pots').html('- ' + pots);
      return $('#todays #coffee #age').html(age);
    });
  };

  updateCantinas = function() {
    if (DEBUG) {
      console.log('updateCantinas');
    }
    Cantina.get(ls.leftCantina, function(menu) {
      var cantinaName;
      cantinaName = Cantina.names[ls.leftCantina];
      $('#cantinas #left .title').html(cantinaName);
      $('#cantinas #left #dinnerbox').html(listDinners(menu));
      return clickDinnerLink('#cantinas #left #dinnerbox li', ls.leftCantina);
    });
    return Cantina.get(ls.rightCantina, function(menu) {
      var cantinaName;
      cantinaName = Cantina.names[ls.rightCantina];
      $('#cantinas #right .title').html(cantinaName);
      $('#cantinas #right #dinnerbox').html(listDinners(menu));
      return clickDinnerLink('#cantinas #right #dinnerbox li', ls.rightCantina);
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
          dinner.price = dinner.price + ',-';
          dinnerlist += '<li id="' + dinner.index + '">' + dinner.price + ' ' + dinner.text + '</li>';
        } else {
          dinnerlist += '<li class="message" id="' + dinner.index + '">"' + dinner.text + '"</li>';
        }
      }
    }
    return dinnerlist;
  };

  clickDinnerLink = function(cssSelector, cantina) {
    return $(cssSelector).click(function() {
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickDinner', $(this).text()]);
      }
      ls.clickedCantina = cantina;
      Browser.openTab(Cantina.url);
      return window.close();
    });
  };

  updateHours = function() {
    if (DEBUG) {
      console.log('updateHours');
    }
    Hours.get(ls.leftCantina, function(hours) {
      $('#cantinas #left .hours').html(hours);
      return clickHours('#cantinas #left .hours', ls.leftCantina);
    });
    return Hours.get(ls.rightCantina, function(hours) {
      $('#cantinas #right .hours').html(hours);
      return clickHours('#cantinas #right .hours', ls.rightCantina);
    });
  };

  clickHours = function(cssSelector, cantina) {
    return $(cssSelector).click(function() {
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickHours', $(this).text()]);
      }
      ls.clickedHours = Hours.cantinas[cantina];
      Browser.openTab(Hours.url);
      return window.close();
    });
  };

  updateBus = function() {
    if (DEBUG) {
      console.log('updateBus');
    }
    if (!navigator.onLine) {
      $('#bus #firstBus .name').html(ls.firstBusName);
      $('#bus #secondBus .name').html(ls.secondBusName);
      $('#bus #firstBus .first .line').html('<div class="error">Frakoblet fra api.visuweb.no</div>');
      return $('#bus #secondBus .first .line').html('<div class="error">Frakoblet fra api.visuweb.no</div>');
    } else {
      createBusDataRequest('firstBus', '#firstBus');
      return createBusDataRequest('secondBus', '#secondBus');
    }
  };

  createBusDataRequest = function(bus, cssIdentificator) {
    var activeLines;
    activeLines = ls[bus + 'ActiveLines'];
    activeLines = JSON.parse(activeLines);
    return Bus.get(ls[bus], activeLines, function(lines) {
      return insertBusInfo(lines, ls[bus + 'Name'], cssIdentificator);
    });
  };

  insertBusInfo = function(lines, stopName, cssIdentificator) {
    var busStop, i, spans, _results;
    busStop = '#bus ' + cssIdentificator;
    spans = ['first', 'second', 'third'];
    $(busStop + ' .name').html(stopName);
    for (i in spans) {
      $(busStop + ' .' + spans[i] + ' .line').html('');
      $(busStop + ' .' + spans[i] + ' .time').html('');
    }
    if (typeof lines === 'string') {
      return $(busStop + ' .first .line').html('<div class="error">' + lines + '</div>');
    } else {
      if (lines['departures'].length === 0) {
        return $(busStop + ' .first .line').html('<div class="error">....zzzZZZzzz....<br />(etter midnatt vises ikke)</div>');
      } else {
        _results = [];
        for (i in spans) {
          $(busStop + ' .' + spans[i] + ' .line').append(lines['destination'][i]);
          _results.push($(busStop + ' .' + spans[i] + ' .time').append(lines['departures'][i]));
        }
        return _results;
      }
    }
  };

  bindOracle = function() {
    if (Oracle.predict() !== null) {
      $('#oracle #question').attr('placeholder', Oracle.msgSuggestPredict + Oracle.predict());
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'oracleSuggest']);
      }
    }
    $('#oracle #question').keyup(function(e) {
      var question;
      question = $('#oracle #question').val();
      if (e.which === 13) {
        if (question !== '') {
          return Oracle.ask(question, function(answer) {
            changeOracleAnswer(answer);
            if (!DEBUG) {
              _gaq.push(['_trackEvent', 'popup', 'oracleAnswer']);
            }
            if (Oracle.predict() !== null) {
              return $('#oracle #question').attr('placeholder', Oracle.msgSuggestPredict + Oracle.predict());
            }
          });
        } else {
          changeOracleAnswer(Oracle.greet());
          if (!DEBUG) {
            return _gaq.push(['_trackEvent', 'popup', 'oracleGreet']);
          }
        }
      } else if (question === '') {
        changeOracleAnswer('');
        if (!DEBUG) {
          return _gaq.push(['_trackEvent', 'popup', 'oracleClear']);
        }
      }
    });
    return $('#oracle').on('keydown', '#question', function(e) {
      var keyCode;
      keyCode = e.keyCode || e.which;
      if (keyCode === 9) {
        e.preventDefault();
        oraclePrediction();
        if (!DEBUG) {
          return _gaq.push(['_trackEvent', 'popup', 'oraclePrediction']);
        }
      }
    });
  };

  changeOracleAnswer = function(answer) {
    clearTimeout(Number(ls.animateOracleAnswerTimeoutId));
    if (answer.match(/<\/?\w+>/g)) {
      $('#oracle #answer').html(answer);
      return $('#oracle #answer a').attr('target', '_blank');
    } else {
      return animateOracleAnswer(answer);
    }
  };

  animateOracleAnswer = function(line, build) {
    var millisecs, text;
    text = $('#oracle #answer').text();
    if (text.length === 0) {
      build = true;
    }
    millisecs = 6;
    if (!build) {
      $('#oracle #answer').text(text.slice(0, text.length - 1));
      return ls.animateOracleAnswerTimeoutId = setTimeout((function() {
        return animateOracleAnswer(line);
      }), millisecs);
    } else {
      if (text.length !== line.length) {
        if (text.length === 0) {
          $('#oracle #answer').text(line.slice(0, 1));
        } else {
          $('#oracle #answer').text(line.slice(0, text.length + 1));
        }
        return ls.animateOracleAnswerTimeoutId = setTimeout((function() {
          return animateOracleAnswer(line, true);
        }), millisecs);
      }
    }
  };

  oraclePrediction = function() {
    var question;
    question = Oracle.predict();
    if (question !== null) {
      changeOracleQuestion(question);
      return Oracle.ask(question, function(answer) {
        changeOracleAnswer(answer);
        return $('#oracle #question').focus();
      });
    } else {
      $('#oracle #question').focus();
      return setTimeout((function() {
        return changeOracleAnswer(Oracle.msgAboutPredict);
      }), 200);
    }
  };

  changeOracleQuestion = function(question) {
    clearTimeout(Number(ls.animateOracleQuestionTimeoutId));
    return animateOracleQuestion(question);
  };

  animateOracleQuestion = function(line) {
    var build, random, text;
    text = $('#oracle #question').val();
    if (text.length === 0) {
      build = true;
    }
    random = Math.floor(100 * Math.random() + 10);
    if (text.length !== line.length) {
      if (text.length === 0) {
        $('#oracle #question').val(line.slice(0, 1));
      } else {
        $('#oracle #question').val(line.slice(0, text.length + 1));
      }
      return ls.animateOracleQuestionTimeoutId = setTimeout((function() {
        return animateOracleQuestion(line);
      }), random);
    }
  };

  updateAffiliationNews = function(number) {
    var feedItems, key, name, selector;
    if (DEBUG) {
      console.log('updateAffiliationNews' + number);
    }
    feedItems = ls['affiliationFeedItems' + number];
    selector = number === '1' ? '#left' : '#right';
    if (ls.showAffiliation2 !== 'true') {
      selector = '#full';
    }
    if (feedItems !== void 0) {
      feedItems = JSON.parse(feedItems);
      return displayItems(feedItems, selector, 'affiliationNewsList' + number, 'affiliationViewedList' + number, 'affiliationUnreadCount' + number);
    } else {
      key = ls['affiliationKey' + number];
      name = Affiliation.org[key].name;
      $('#news ' + selector).html('<div class="post"><div class="item"><div class="title">' + name + '</div>Frakoblet fra nyhetsstrøm</div></div>');
      return $('#news ' + selector).click(function() {
        return Browser.openTab(Affiliation.org[key].web);
      });
    }
  };

  displayItems = function(items, column, newsListName, viewedListName, unreadCountName) {
    var altLink, feedKey, index, link, newsList, updatedList, viewedList;
    $('#news ' + column).html('');
    feedKey = items[0].feedKey;
    newsList = JSON.parse(ls[newsListName]);
    viewedList = JSON.parse(ls[viewedListName]);
    updatedList = findUpdatedPosts(newsList, viewedList);
    viewedList = [];
    $.each(items, function(index, item) {
      var altLink, date, descLimit, htmlItem, readUnread, unreadCount, _ref;
      if (index < newsLimit) {
        viewedList.push(item.link);
        unreadCount = Number(ls[unreadCountName]);
        readUnread = '';
        if (index < unreadCount) {
          if (_ref = item.link, __indexOf.call(updatedList.indexOf, _ref) >= 0) {
            readUnread += '<span class="unread">UPDATED <b>::</b> </span>';
          } else {
            readUnread += '<span class="unread">NEW <b>::</b> </span>';
          }
        }
        date = altLink = '';
        if (item.altLink !== null) {
          altLink = ' name="' + item.altLink + '"';
        }
        if (item.date !== null && ls.showAffiliation2 === 'false') {
          date = ' den ' + item.date;
        }
        descLimit = 140;
        if (ls.showAffiliation2 === 'true') {
          descLimit = 100;
        }
        if (item.description.length > descLimit) {
          item.description = item.description.substr(0, descLimit) + '...';
        }
        htmlItem = '\
        <div class="post">\
          <div class="item" data="' + item.link + '"' + altLink + '>\
            <div class="title">' + readUnread + item.title + '</div>\
            <img src="' + item.image + '" width="107" />\
            ' + item.description + '\
            <div class="author">&ndash; Av ' + item.creator + date + '</div>\
          </div>\
        </div>';
        return $('#news ' + column).append(htmlItem);
      }
    });
    ls[viewedListName] = JSON.stringify(viewedList);
    Browser.setBadgeText('');
    ls[unreadCountName] = 0;
    $('#news ' + column + ' .item').click(function() {
      var altLink, link, useAltLink;
      link = $(this).attr('data');
      altLink = $(this).attr('name');
      useAltLink = Affiliation.org[feedKey].useAltLink;
      if (altLink !== void 0 && useAltLink === true) {
        link = $(this).attr('name');
      }
      Browser.openTab(link);
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickNews', link]);
      }
      return window.close();
    });
    if (Affiliation.org[feedKey].useAltLink) {
      altLink = $('.item[data="' + link + '"]').attr('name');
      if (altLink !== 'null') {
        $('.item[data="' + link + '"]').attr('data', altLink);
      }
    }
    if (Affiliation.org[feedKey].getImage !== void 0) {
      for (index in viewedList) {
        link = viewedList[index];
        Affiliation.org[feedKey].getImage(link, function(link, image) {
          if ($('.item[data="' + link + '"] img').attr('src').indexOf('http') === -1) {
            return $('.item[data="' + link + '"] img').attr('src', image);
          }
        });
      }
    }
    if (Affiliation.org[feedKey].getImages !== void 0) {
      return Affiliation.org[feedKey].getImages(viewedList, function(links, images) {
        var _results;
        _results = [];
        for (index in links) {
          if ($('.item[data="' + links[index] + '"] img').attr('src').indexOf('http') === -1) {
            _results.push($('.item[data="' + links[index] + '"] img').attr('src', images[index]));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
    }
  };

  findUpdatedPosts = function(newsList, viewedList) {
    var i, j, updatedList;
    updatedList = [];
    for (i in newsList) {
      if (newsList[i] === viewedList[0]) {
        break;
      }
      for (j in viewedList) {
        if (j === 0) {
          continue;
        }
        if (newsList[i] === viewedList[j]) {
          updatedList.push(newsList[i]);
        }
      }
    }
    return updatedList;
  };

  optionsText = function(show) {
    return fadeButtonText(show, 'Innstillinger');
  };

  tipsText = function(show) {
    return fadeButtonText(show, '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Tips++');
  };

  cookieText = function(show) {
    return fadeButtonText(show, '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;\
    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Eat Their Cookies');
  };

  cookieTextFinished = function(show) {
    return fadeButtonText(show, '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;\
    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; OM NOM NOM NOM');
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

  clearCookies = function(cookieUrl) {
    return chrome.cookies.getAll({
      url: cookieUrl
    }, function(cookies) {
      var i, name, url, _results;
      _results = [];
      for (i in cookies) {
        url = cookies[i].domain;
        name = cookies[i].name;
        if (DEBUG) {
          console.log('Found cookie in the kitchen:', url, name);
        }
        _results.push(chrome.cookies.remove({
          url: 'http://' + url,
          name: name
        }, function(response) {
          if (DEBUG) {
            return console.log('Ate cookie:', response);
          }
        }));
      }
      return _results;
    });
  };

  $(function() {
    var icon, key, logo, placeholder;
    $.ajaxSetup(AJAX_SETUP);
    if (ls.useInfoscreen === 'true') {
      Browser.openTab('infoscreen.html');
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'toggleInfoscreen']);
      }
      setTimeout((function() {
        return window.close();
      }), 250);
    }
    if (ls.showAffiliation2 !== 'true') {
      $('#news #right').hide();
      $('#news #left').attr('id', 'full');
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'loadSingleAffiliation', ls.affiliationKey1]);
      }
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'loadAffiliation1', ls.affiliationKey1]);
      }
    } else {
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'loadDoubleAffiliation', ls.affiliationKey1 + ' - ' + ls.affiliationKey2]);
      }
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'loadAffiliation1', ls.affiliationKey1]);
      }
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'loadAffiliation2', ls.affiliationKey2]);
      }
    }
    if (ls.showOffice !== 'true') {
      $('#todays').hide();
    }
    if (ls.showCantina !== 'true') {
      $('#cantinas').hide();
    }
    if (ls.showBus !== 'true') {
      $('#bus').hide();
    }
    hotFixBusLines();
    if (ls.affiliationKey1 !== 'online') {
      $('#chatterButton').hide();
      $('#mobileText').hide();
    }
    key = ls.affiliationKey1;
    logo = Affiliation.org[key].logo;
    icon = Affiliation.org[key].icon;
    placeholder = Affiliation.org[key].placeholder;
    $('#logo').prop('src', logo);
    $('link[rel="shortcut icon"]').attr('href', icon);
    $('#news .post img').attr('src', placeholder);
    if (!DEBUG) {
      _gaq.push(['_trackEvent', 'popup', 'loadPalette', ls.affiliationPalette]);
    }
    if (ls.showCookieButton === 'true') {
      $('#cookieButton').show();
    }
    $('#logo').click(function() {
      var name, web;
      name = Affiliation.org[ls.affiliationKey1].name;
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickLogo', name]);
      }
      web = Affiliation.org[ls.affiliationKey1].web;
      Browser.openTab(web);
      return window.close();
    });
    $('#optionsButton').click(function() {
      Browser.openTab('options.html');
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickOptions']);
      }
      return window.close();
    });
    $('#tipsButton').click(function() {
      if ($('#tips').filter(':visible').length === 1) {
        return $('#tips').fadeOut('fast');
      } else {
        $('#tips').fadeIn('fast');
        if (!DEBUG) {
          return _gaq.push(['_trackEvent', 'popup', 'clickTips']);
        }
      }
    });
    $('#tips:not(a)').click(function() {
      return $('#tips').fadeOut('fast');
    });
    $('#tips a').click(function() {
      var link;
      link = $(this).attr('href');
      Browser.openTab(link);
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickTipsLink', link]);
      }
      return window.close();
    });
    $('#chatterButton').click(function() {
      Browser.openTab('http://webchat.freenode.net/?channels=online');
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickChatter']);
      }
      return window.close();
    });
    $('#cookieButton').click(function() {
      clearCookies('http://www.aftenposten.no');
      cookieTextFinished(true);
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickCookie']);
      }
      return setTimeout((function() {
        return window.close();
      }), 300);
    });
    $('#bus #atbLogo').click(function() {
      Browser.openTab('http://www.atb.no');
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'popup', 'clickAtb']);
      }
      return window.close();
    });
    bindOracle();
    $('#oracle #name').click(function() {
      return $('#oracle #question').focus();
    });
    $('#optionsButton').mouseenter(function() {
      return optionsText(true);
    });
    $('#optionsButton').mouseleave(function() {
      return optionsText(false);
    });
    $('#tipsButton').mouseenter(function() {
      return tipsText(true);
    });
    $('#tipsButton').mouseleave(function() {
      return tipsText(false);
    });
    $('#cookieButton').mouseenter(function() {
      return cookieText(true);
    });
    $('#cookieButton').mouseleave(function() {
      return cookieText(false);
    });
    $(document).konami({
      code: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'],
      callback: function() {
        if (!DEBUG) {
          _gaq.push(['_trackEvent', 'popup', 'toggleKonami']);
        }
        ls.showCookieButton = 'true';
        setTimeout((function() {
          return $('#cookieButton').fadeIn('swing');
        }), 2500);
        $('head').append('<style type="text/css">\
        @-webkit-keyframes adjustHue {\
          0% { -webkit-filter: hue-rotate(0deg); }\
          10% { -webkit-filter: hue-rotate(36deg); }\
          20% { -webkit-filter: hue-rotate(72deg); }\
          30% { -webkit-filter: hue-rotate(108deg); }\
          40% { -webkit-filter: hue-rotate(144deg); }\
          50% { -webkit-filter: hue-rotate(180deg); }\
          60% { -webkit-filter: hue-rotate(216deg); }\
          70% { -webkit-filter: hue-rotate(252deg); }\
          80% { -webkit-filter: hue-rotate(288deg); }\
          90% { -webkit-filter: hue-rotate(324deg); }\
          100% { -webkit-filter: hue-rotate(360deg); }\
        }</style>');
        return $('#background').attr('style', '-webkit-animation:adjustHue 10s alternate infinite;');
      }
    });
    $('#oracle #question').focus();
    return mainLoop();
  });

}).call(this);
