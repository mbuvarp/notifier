// Generated by CoffeeScript 1.4.0
(function() {
  var $, fetchAndStoreImageLinks, intervalId, iteration, loadAffiliationIcon, ls, mainLoop, saveAndCountNews, updateAffiliationNews, updateCantinas, updateCoffeeSubscription, updateHours, updateOfficeAndMeetings, updateUnreadCount,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = jQuery;

  ls = localStorage;

  iteration = 0;

  intervalId = null;

  mainLoop = function(force) {
    console.lolg("\n#" + iteration);
    if (ls.showCantina === 'true') {
      if (force || iteration % UPDATE_HOURS_INTERVAL === 0) {
        updateHours();
      }
    }
    if (ls.showCantina === 'true') {
      if (force || iteration % UPDATE_CANTINAS_INTERVAL === 0) {
        updateCantinas();
      }
    }
    if (ls.showAffiliation1 === 'true') {
      if (force || iteration % UPDATE_NEWS_INTERVAL === 0) {
        updateAffiliationNews('1');
      }
    }
    if (ls.showAffiliation2 === 'true') {
      if (force || iteration % UPDATE_NEWS_INTERVAL === 0) {
        updateAffiliationNews('2');
      }
    }
    if (ls.useInfoscreen !== 'true') {
      if (Affiliation.org[ls.affiliationKey1].hw) {
        if (ls.showOffice === 'true') {
          if (force || iteration % UPDATE_OFFICE_INTERVAL === 0) {
            updateOfficeAndMeetings();
          }
        }
        if (ls.coffeeSubscription === 'true') {
          if (force || iteration % UPDATE_COFFEE_INTERVAL === 0) {
            updateCoffeeSubscription();
          }
        }
      }
    }
    if (10000 < iteration) {
      return iteration = 0;
    } else {
      return iteration++;
    }
  };

  updateOfficeAndMeetings = function(force) {
    console.lolg('updateOfficeAndMeetings');
    return Office.get(function(status, message) {
      var errorIcon, msgs, statusIcon, title;
      title = '';
      if (force || ls.officeStatus !== status || ls.officeStatusMessage !== message) {
        if (__indexOf.call(Object.keys(Office.foods), status) >= 0) {
          title = Office.foods[status].title;
          Browser.setIcon(Office.foods[status].icon);
        } else {
          title = Office.statuses[status].title;
          statusIcon = Affiliation.org[ls.affiliationKey1].hw.statusIcons[status];
          if (statusIcon !== void 0) {
            Browser.setIcon(statusIcon);
          } else {
            errorIcon = Affiliation.org[ls.affiliationKey1].icon;
            Browser.setIcon(errorIcon);
          }
        }
        ls.officeStatus = status;
        ls.officeStatusMessage = message;
        msgs = Affiliation.org[ls.affiliationKey1].hw.statusMessages;
        if (msgs) {
          if (msgs[status]) {
            message = msgs[status];
          }
        }
        return Meetings.get(function(meetings) {
          var today;
          today = '### Nå\n' + title + ": " + message + "\n### Resten av dagen\n" + meetings;
          return Browser.setTitle(today);
        });
      }
    });
  };

  updateCoffeeSubscription = function() {
    console.lolg('updateCoffeeSubscription');
    return Coffee.get(false, function(pots, age) {
      var storedPots;
      if (!isNaN(pots && !isNaN(age))) {
        storedPots = Number(ls.coffeePots);
        if (storedPots < pots) {
          if (ls.officeStatus !== 'meeting') {
            if (age < 10) {
              Coffee.showNotification(pots, age);
            }
          }
        }
        return ls.coffeePots = pots;
      }
    });
  };

  updateCantinas = function() {
    console.lolg('updateCantinas');
    Cantina.get(ls.leftCantina, function(menu) {
      return ls.leftCantinaMenu = JSON.stringify(menu);
    });
    return Cantina.get(ls.rightCantina, function(menu) {
      return ls.rightCantinaMenu = JSON.stringify(menu);
    });
  };

  updateHours = function() {
    console.lolg('updateHours');
    Hours.get(ls.leftCantina, function(hours) {
      return ls.leftCantinaHours = hours;
    });
    return Hours.get(ls.rightCantina, function(hours) {
      return ls.rightCantinaHours = hours;
    });
  };

  updateAffiliationNews = function(number) {
    var affiliationKey, affiliationObject, newsLimit;
    console.lolg('updateAffiliationNews' + number);
    affiliationKey = ls['affiliationKey' + number];
    affiliationObject = Affiliation.org[affiliationKey];
    if (affiliationObject) {
      newsLimit = 10;
      return News.get(affiliationObject, newsLimit, function(items) {
        if (typeof items === 'string') {
          return console.lolg('ERROR:', items);
        } else if (items.length === 0) {
          return updateUnreadCount(0, 0);
        } else {
          saveAndCountNews(items, number);
          updateUnreadCount();
          return fetchAndStoreImageLinks(number);
        }
      });
    } else {
      return console.lolg('ERROR: chosen affiliation', ls['affiliationKey' + number], 'is not known');
    }
  };

  saveAndCountNews = function(items, number) {
    var feedItems, lastNotified, list, newsList, unreadCount;
    feedItems = 'affiliationFeedItems' + number;
    newsList = 'affiliationNewsList' + number;
    unreadCount = 'affiliationUnreadCount' + number;
    lastNotified = 'affiliationLastNotified' + number;
    ls[feedItems] = JSON.stringify(items);
    list = JSON.parse(ls[newsList]);
    ls[unreadCount] = News.countNewsAndNotify(items, list, lastNotified);
    return ls[newsList] = News.refreshNewsList(items);
  };

  updateUnreadCount = function(count1, count2) {
    var unreadCount;
    unreadCount = (Number(ls.affiliationUnreadCount1)) + (Number(ls.affiliationUnreadCount2));
    return Browser.setBadgeText(String(unreadCount));
  };

  fetchAndStoreImageLinks = function(number) {
    var index, key, link, newsList;
    key = ls['affiliationKey' + number];
    newsList = JSON.parse(ls['affiliationNewsList' + number]);
    if (Affiliation.org[key].getImage !== void 0) {
      for (index in newsList) {
        link = newsList[index];
        Affiliation.org[key].getImage(link, function(link, image) {
          var storedImages;
          if (null !== image[0]) {
            storedImages = JSON.parse(ls.storedImages);
            storedImages[link] = image[0];
            return ls.storedImages = JSON.stringify(storedImages);
          }
        });
      }
    }
    if (Affiliation.org[key].getImages !== void 0) {
      return Affiliation.org[key].getImages(newsList, function(links, images) {
        var storedImages;
        storedImages = JSON.parse(ls.storedImages);
        for (index in links) {
          if (null !== images[index]) {
            storedImages[links[index]] = images[index];
          }
        }
        return ls.storedImages = JSON.stringify(storedImages);
      });
    }
  };

  loadAffiliationIcon = function() {
    var icon, key, name;
    key = ls.affiliationKey1;
    icon = Affiliation.org[key].icon;
    Browser.setIcon(icon);
    name = Affiliation.org[key].name;
    return Browser.setTitle(name + ' Notifier');
  };

  $(function() {
    var isAvailable, keys, stayUpdated;
    keys = Object.keys(Affiliation.org);
    Defaults.resetAffiliationsIfNotExist(ls.affiliationKey1, ls.affiliationKey2, keys);
    isAvailable = Affiliation.org[ls.affiliationKey1].hw ? true : false;
    Defaults.setHardwareFeatures(isAvailable);
    if (ls.everOpenedOptions === 'false' && !DEBUG) {
      Browser.openTab('options.html');
      Analytics.trackEvent('loadOptions (fresh install)');
    }
    if (ls.useInfoscreen === 'true') {
      Browser.openTab('infoscreen.html');
      Analytics.trackEvent('loadInfoscreen');
    }
    if (ls.openChatter === 'true') {
      Browser.openBackgroundTab('http://webchat.freenode.net/?channels=online');
      Analytics.trackEvent('loadChatter');
    }
    loadAffiliationIcon();
    Browser.bindCommandHotkeys(Affiliation.org[ls.affiliationKey1].web);
    Browser.registerNotificationListeners();
    Browser.bindOmniboxToOracle();
    window.updateOfficeAndMeetings = updateOfficeAndMeetings;
    window.updateCoffeeSubscription = updateCoffeeSubscription;
    window.updateHours = updateHours;
    window.updateCantinas = updateCantinas;
    window.updateAffiliationNews = updateAffiliationNews;
    window.loadAffiliationIcon = loadAffiliationIcon;
    setInterval((function() {
      Analytics.trackEvent('appVersion', Browser.getAppVersion() + ' @ ' + Browser.name);
      if (ls.showAffiliation2 !== 'true') {
        Analytics.trackEvent('singleAffiliation', ls.affiliationKey1);
        return Analytics.trackEvent('affiliation1', ls.affiliationKey1);
      } else {
        Analytics.trackEvent('doubleAffiliation', ls.affiliationKey1 + ' - ' + ls.affiliationKey2);
        Analytics.trackEvent('affiliation1', ls.affiliationKey1);
        return Analytics.trackEvent('affiliation2', ls.affiliationKey2);
      }
    }), 1000 * 60 * 60 * 24);
    stayUpdated = function(now) {
      var loopTimeout, timeout;
      console.lolg(ONLINE_MESSAGE);
      loopTimeout = DEBUG ? BACKGROUND_LOOP_DEBUG : BACKGROUND_LOOP;
      intervalId = setInterval((function() {
        return mainLoop();
      }), loopTimeout);
      timeout = now ? 0 : 2000;
      return setTimeout((function() {
        return mainLoop(true);
      }), timeout);
    };
    window.addEventListener('online', stayUpdated);
    window.addEventListener('offline', function() {
      console.lolg(OFFLINE_MESSAGE);
      return clearInterval(intervalId);
    });
    if (navigator.onLine) {
      return stayUpdated(true);
    } else {
      return mainLoop();
    }
  });

}).call(this);
