var $, animateCreatorName, calculateUrgency, changeCreatorName, createBusDataRequest, insertBusInfo, iteration, listDinners, ls, mainLoop, newsLimit, updateBus, updateCantinas, updateCoffee, updateHours, updateMeetings, updateOffice, updateServant,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

$ = jQuery;

ls = localStorage;

iteration = 0;

newsLimit = 8;

mainLoop = function() {
  console.lolg("\n#" + iteration);
  if (navigator.onLine) {
    if (iteration % UPDATE_HOURS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateHours();
    }
    if (iteration % UPDATE_CANTINAS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateCantinas();
    }
  }
  if (Affiliation.org[ls.affiliationKey1].hw) {
    if (iteration % UPDATE_OFFICE_INTERVAL === 0 && ls.showOffice === 'true') {
      updateOffice();
    }
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
  if (iteration % UPDATE_BUS_INTERVAL === 0 && ls.showBus === 'true') {
    updateBus();
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

updateOffice = function(debugStatus) {
  console.lolg('updateOffice');
  return Office.get(function(status, message) {
    if (DEBUG && debugStatus) {
      status = debugStatus;
      message = 'debugging';
    }
    if (ls.officescreenOfficeStatus !== status || ls.officescreenOfficeStatusMessage !== message) {
      if (__indexOf.call(Object.keys(Office.foods), status) >= 0) {
        $('#now #text #status').text(Office.foods[status].title);
        $('#now #text #status').css('color', Office.foods[status].color);
      } else {
        $('#now #text #status').html(Office.statuses[status].title);
        $('#now #text #status').css('color', Office.statuses[status].color);
      }
      $('#now #text #info').html(message);
      ls.officescreenOfficeStatus = status;
      return ls.officescreenOfficeStatusMessage = message;
    }
  });
};

updateServant = function() {
  console.lolg('updateServant');
  return Servant.get(function(servant) {
    return $('#todays #schedule #servant').html('- ' + servant);
  });
};

updateMeetings = function() {
  console.lolg('updateMeetings');
  return Meetings.get(function(meetings) {
    meetings = '<span>' + meetings;
    meetings = meetings.replace(/\n/g, '<br /><span>');
    meetings = meetings.replace(/:/g, ':</span>');
    return $('#todays #schedule #meetings').html(meetings);
  });
};

updateCoffee = function() {
  console.lolg('updateCoffee');
  return Coffee.get(true, function(pots, age) {
    $('#todays #coffee #pots').html('- ' + pots);
    return $('#todays #coffee #age').html(age);
  });
};

updateCantinas = function(first) {
  var update;
  console.lolg('updateCantinas');
  update = function(shortname, menu, selector) {
    var name;
    name = Cantina.names[shortname];
    $('#cantinas #' + selector + ' .title').html(name);
    return $('#cantinas #' + selector + ' #dinnerbox').html(listDinners(menu));
  };
  Cantina.get(ls.leftCantina, function(menu) {
    return update(ls.leftCantina, menu, 'left');
  });
  return Cantina.get(ls.rightCantina, function(menu) {
    return update(ls.rightCantina, menu, 'right');
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
        dinnerlist += '<li id="' + dinner.index + '"><span>' + dinner.price + '</span> ' + dinner.text + '</li>';
      } else {
        dinnerlist += '<li class="message" id="' + dinner.index + '">"' + dinner.text + '"</li>';
      }
    }
  }
  return dinnerlist;
};

updateHours = function() {
  console.lolg('updateHours');
  Hours.get(ls.leftCantina, function(hours) {
    return $('#cantinas #left .hours').html(hours);
  });
  return Hours.get(ls.rightCantina, function(hours) {
    return $('#cantinas #right .hours').html(hours);
  });
};

updateBus = function() {
  console.lolg('updateBus');
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
  var busStop, departString, i, spans, urgency, _results;
  busStop = '#bus ' + cssIdentificator;
  spans = ['first', 'second', 'third', 'fourth', 'fifth'];
  $(busStop + ' .name').html(stopName);
  for (i in spans) {
    $(busStop + ' .' + spans[i] + ' .line').html('');
    $(busStop + ' .' + spans[i] + ' .time').html('');
  }
  if (typeof lines === 'string') {
    return $(busStop + ' .first .line').html('<div class="error">' + lines + '</div>');
  } else {
    if (lines['departures'].length === 0) {
      return $(busStop + ' .first .line').html('<div class="error">....zzzZZZzzz....</div>');
    } else {
      _results = [];
      for (i in spans) {
        $(busStop + ' .' + spans[i] + ' .line').append(lines['destination'][i]);
        urgency = calculateUrgency(lines['departures'][i]);
        departString = '<span style="color: ' + urgency + ';">' + lines['departures'][i] + '</span>';
        _results.push($(busStop + ' .' + spans[i] + ' .time').append(departString));
      }
      return _results;
    }
  }
};

calculateUrgency = function(timeString) {
  var time, urgencyColors;
  urgencyColors = ['#DF0101', '#FF0000', '#FE2E2E', '#FA5858', '#F78181', '#F5A9A9', '#F6CECE', '#F8E0E0', '#FBEFEF', '#FFFFFF', '#DDDDDD', '#BBBBBB'];
  timeString = timeString.replace('ca ', '');
  timeString = timeString.replace(' min', '');
  if (timeString === 'nå') {
    return urgencyColors[0];
  } else if (timeString.match(/[0-9]{2}:[0-9]{2}/g)) {
    return urgencyColors[11];
  } else {
    time = Number(timeString);
    if (time < 22) {
      return urgencyColors[Math.floor(time / 2)];
    }
  }
  return urgencyColors[11];
};

changeCreatorName = function(name) {
  clearTimeout(ls.changeCreatorNameTimeoutId);
  return animateCreatorName(name);
};

animateCreatorName = function(name, build) {
  var random, text;
  text = $('#pagefliptyping').text();
  if (text.length === 0) {
    build = true;
    name = name + " with <3";
  }
  random = Math.floor(350 * Math.random() + 50);
  if (!build) {
    $('#pagefliptyping').text(text.slice(0, text.length - 1));
    return ls.animateCreatorNameTimeoutId = setTimeout((function() {
      return animateCreatorName(name);
    }), random);
  } else {
    if (text.length !== name.length) {
      if (text.length === 0) {
        $('#pagefliptyping').text(name.slice(0, 1));
      } else {
        $('#pagefliptyping').text(name.slice(0, text.length + 1));
      }
      return ls.animateCreatorNameTimeoutId = setTimeout((function() {
        return animateCreatorName(name, true);
      }), random);
    }
  }
};

$(function() {
  var icon, key, logo, placeholder, sponsor;
  if (DEBUG) {
    $('html').css('cursor', 'auto');
    $('#container').css('overflow-y', 'auto');
    $('body').on('keypress', function(e) {
      if (e.which === 13) {
        $('#overlay').toggle();
        $('#fadeOutNews').toggle();
        $('#logo').toggle();
        $('#pageflip').toggle();
      }
      if (e.which === 32) {
        return e.preventDefault();
      }
    });
  }
  ls.removeItem('officescreenOfficeStatus');
  ls.removeItem('officescreenOfficeStatusMessage');
  if (ls.showOffice !== 'true') {
    $('#todays').hide();
  }
  if (ls.showCantina !== 'true') {
    $('#cantinas').hide();
  }
  if (ls.showBus !== 'true') {
    $('#bus').hide();
  }
  key = ls.affiliationKey1;
  logo = Affiliation.org[key].logo;
  icon = Affiliation.org[key].icon;
  placeholder = Affiliation.org[key].placeholder;
  sponsor = Affiliation.org[key].sponsor;
  if (sponsor !== void 0) {
    $('#logo').prop('src', sponsor);
  } else {
    $('#logo').prop('src', logo);
  }
  $('link[rel="shortcut icon"]').attr('href', icon);
  Analytics.trackEvent('loadPalette', ls.affiliationPalette);
  if (Browser.onWindows()) {
    $('#pfText').attr("style", "bottom:9px;");
    $('#pfLink').attr("style", "bottom:9px;");
  }
  changeCreatorName(ls.extensionCreator);
  setInterval((function() {
    return $(".pageflipcursor").animate({
      opacity: 0
    }, "fast", "swing", function() {
      return $(this).animate({
        opacity: 1
      }, "fast", "swing");
    });
  }), 600);
  setInterval((function() {
    var linebreaks, num, random;
    random = Math.ceil(Math.random() * 25);
    linebreaks = ((function() {
      var _i, _results;
      _results = [];
      for (num = _i = 0; 0 <= random ? _i <= random : _i >= random; num = 0 <= random ? ++_i : --_i) {
        _results.push('<br />');
      }
      return _results;
    })()).join(' ');
    $('#overlay').html(linebreaks + 'preventing image burn-in...');
    $('#overlay').css('opacity', 1);
    return setTimeout((function() {
      return $('#overlay').css('opacity', 0);
    }), 3500);
  }), 1800000);
  return mainLoop();
});
