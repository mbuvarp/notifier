# Notify Coffeescript that jQuery is here
$ = jQuery
ls = localStorage
iteration = 0
intervalId = null

newsLimit = 4 # The best amount of news for the popup, IMO

mainLoop = (force) ->
  console.lolg "\n#" + iteration

  if ls.showCantina is 'true'
    if force or iteration % UPDATE_HOURS_INTERVAL is 0
      updateHours()
  if ls.showCantina is 'true'
    if force or iteration % UPDATE_CANTINAS_INTERVAL is 0
      updateCantinas()
  if ls.showAffiliation1 is 'true'
    if force or iteration % UPDATE_NEWS_INTERVAL is 0
      updateAffiliationNews '1'
  if ls.showAffiliation2 is 'true'
    if force or iteration % UPDATE_NEWS_INTERVAL is 0
      updateAffiliationNews '2'
  # Only if hardware
  if Affiliation.org[ls.affiliationKey1].hw
    if ls.showOffice is 'true'
      if force or iteration % UPDATE_SERVANT_INTERVAL is 0
        updateServant()
    if ls.showOffice is 'true'
      if force or iteration % UPDATE_MEETINGS_INTERVAL is 0
        updateMeetings()
    if ls.showOffice is 'true'
      if force or iteration % UPDATE_COFFEE_INTERVAL is 0
        updateCoffee()
  # Always update, tell when offline
  if ls.showBus is 'true'
    if force or iteration % UPDATE_BUS_INTERVAL is 0
      updateBus()
  
  # No reason to count to infinity
  if 10000 < iteration then iteration = 0 else iteration++

updateServant = ->
  console.lolg 'updateServant'
  Servant.get (servant) ->
    $('#todays #schedule #servant').html '- '+servant

updateMeetings = ->
  console.lolg 'updateMeetings'
  Meetings.get (meetings) ->
    meetings = meetings.replace /\n/g, '<br />'
    $('#todays #schedule #meetings').html meetings

updateCoffee = ->
  console.lolg 'updateCoffee'
  Coffee.get true, (pots, age) ->
    $('#todays #coffee #pots').html '- '+pots
    $('#todays #coffee #age').html age

updateCantinas = (first) ->
  # This function just fetches from localstorage (updates in background)
  console.lolg 'updateCantinas'
  update = (shortname, menu, selector) ->
    name = Cantina.names[shortname]
    $('#cantinas #'+selector+' .title').html name
    $('#cantinas #'+selector+' #dinnerbox').html listDinners menu
    clickDinnerLink '#cantinas #'+selector+' #dinnerbox li', shortname
  menu1 = JSON.parse ls.leftCantinaMenu
  menu2 = JSON.parse ls.rightCantinaMenu
  update ls.leftCantina, menu1, 'left'
  update ls.rightCantina, menu2, 'right'

listDinners = (menu) ->
  dinnerlist = ''
  # If menu is just a message, not a menu: (yes, a bit hackish, but reduces complexity in the cantina script)
  if typeof menu is 'string'
    ls.noDinnerInfo = 'true'
    dinnerlist += '<li>' + menu + '</li>'
  else
    ls.noDinnerInfo = 'false'
    for dinner in menu
      if dinner.price != null
        dinner.price = dinner.price + ',-'
        dinnerlist += '<li id="' + dinner.index + '">' + dinner.price + ' ' + dinner.text + '</li>'
      else
        dinnerlist += '<li class="message" id="' + dinner.index + '">"' + dinner.text + '"</li>'
  return dinnerlist

clickDinnerLink = (cssSelector, cantina) ->
  $(cssSelector).click ->
    Analytics.trackEvent 'clickDinner', $(this).text()
    ls.clickedCantina = cantina
    Browser.openTab Cantina.url
    window.close()

updateHours = (first) ->
  # This function just fetches from localstorage (updates in background)
  console.lolg 'updateHours'
  update = (shortname, hours, selector) ->
    $('#cantinas #'+selector+' .hours').html hours
    clickHours '#cantinas #'+selector+' .hours', shortname
  update ls.leftCantina, ls.leftCantinaHours, 'left'
  update ls.rightCantina, ls.rightCantinaHours, 'right'

clickHours = (cssSelector, cantina) ->
  $(cssSelector).click ->
    Analytics.trackEvent 'clickHours', $(this).text()
    ls.clickedHours = Hours.cantinas[cantina]
    Browser.openTab Hours.url
    window.close()

updateBus = ->
  console.lolg 'updateBus'
  if !navigator.onLine
    # Reset
    stops = ['firstBus', 'secondBus']
    spans = ['first', 'second', 'third']
    for i of stops
      for j of spans
        $('#bus #'+stops[i]+' .'+spans[j]+' .line').html ''
        $('#bus #'+stops[i]+' .'+spans[j]+' .time').html ''
    # Error message
    $('#bus #firstBus .name').html ls.firstBusName
    $('#bus #secondBus .name').html ls.secondBusName
    $('#bus #firstBus .error').html '<div class="error">Frakoblet fra api.visuweb.no</div>'
    $('#bus #secondBus .error').html '<div class="error">Frakoblet fra api.visuweb.no</div>'      
  else
    createBusDataRequest('firstBus', '#firstBus')
    createBusDataRequest('secondBus', '#secondBus')

createBusDataRequest = (bus, cssIdentificator) ->
  activeLines = ls[bus+'ActiveLines'] # array of lines stringified with JSON (hopefully)
  activeLines = JSON.parse activeLines
  # Get bus data, if activeLines is an empty array we'll get all lines, no problemo :D
  Bus.get ls[bus], activeLines, (lines) ->
    insertBusInfo lines, ls[bus+'Name'], cssIdentificator

insertBusInfo = (lines, stopName, cssIdentificator) ->
  busStop = '#bus '+cssIdentificator
  spans = ['first', 'second', 'third']

  $(busStop+' .name').html stopName

  # Reset spans
  for i of spans
    $(busStop+' .'+spans[i]+' .line').html ''
    $(busStop+' .'+spans[i]+' .time').html ''
  $(busStop+' .error').html ''
  
  # if lines is an error message
  if typeof lines is 'string'
    # if online, recommend oracle
    if navigator.onLine
      $(busStop+' .error').html lines+'<br />Prøv Orakelet i stedet'
    else
      $(busStop+' .error').html lines
  else
    # No lines to display, busstop is sleeping
    if lines['departures'].length is 0
      $(busStop+' .error').html '....zzzZZZzzz....'
    else
      # Display line for line with according times
      for i of spans
        # Add the current line
        $(busStop+' .'+spans[i]+' .line').append lines['destination'][i]
        $(busStop+' .'+spans[i]+' .time').append lines['departures'][i]

bindOracle = ->
  # Suggest prediction
  if Oracle.predict() isnt null
    $('#oracle #question').attr 'placeholder', Oracle.predict() + Oracle.msgPredictPostfix
    Analytics.trackEvent 'oracleSuggest'
  # User input
  $('#oracle').on 'keyup', '#question', (e) ->
    question = $('#oracle #question').val()
    # Clicked enter
    if e.which is 13
      if question isnt ''
        Oracle.ask question, (answer) ->
          changeOracleAnswer answer
          Analytics.trackEvent 'oracleAnswer'
          # Update suggested prediction
          if Oracle.predict() isnt null
            $('#oracle #question').attr 'placeholder', Oracle.predict() + Oracle.msgPredictPostfix
      else
        changeOracleAnswer Oracle.greet()
        Analytics.trackEvent 'oracleGreet'
    # Cleared field
    else if question is '' and e.which isnt 9 # Tab is reserved
      changeOracleAnswer ''
      Analytics.trackEvent 'oracleClear'
  # Keydown works better with tab
  $('#oracle').on 'keydown', '#question', (e) ->
    # Clicked tab: Predict question
    if e.which is 9
      e.preventDefault()
      oraclePrediction()
      Analytics.trackEvent 'oraclePrediction'

changeOracleAnswer = (answer) ->
  console.lolg 'changeOracleAnswer to "' + answer + '"'
  # Stop previous changeOracleAnswer instance, if any
  clearTimeout Number ls.animateOracleAnswerTimeoutId
  # If answer contains HTML, just insert it as HTML
  if answer.match /<\/?\w+>/g
    if $('#oracle #answer .piece').size() is 0
      $('#oracle #answer').append '<div class="piece">' + answer + '</div>'
      $('#oracle #answer .piece a').attr 'target', '_blank'
    else
      # Remove all preexisting pieces
      $('#oracle #answer .piece').fadeOut 400, ->
        $('#oracle #answer .piece').remove()
        $('#oracle #answer').append '<div class="piece">' + answer + '</div>'
        $('#oracle #answer .piece a').attr 'target', '_blank'
  # Animate oracle answer name change
  else
    func = (answer) ->
      pieces = answer.split '@'
      # Insert piece placeholders
      for i of pieces
        $('#oracle #answer').append '<div class="piece"></div>'
      for i of pieces
        animateOracleAnswer pieces[i], i, (index) ->
          # html = $('#oracle #answer .piece').eq(index).html()
          # html = html.replace /((Buss \d+)|(Holdeplass):)/gi, '<u>$1</u>'
          # $('#oracle #answer .piece').eq(index).html html
    # Check for preexisting pieces
    if $('#oracle #answer .piece').size() is 0
      func answer
    else
      # Remove all preexisting pieces
      $('#oracle #answer .piece').fadeOut 400, ->
        $('#oracle #answer .piece').remove()
        func answer

animateOracleAnswer = (line, index, callback, build) ->
  # Animate it
  text = $('#oracle #answer .piece').eq(index).text()
  if text.length is 0
    build = true
  millisecs = 6
  if !build
    $('#oracle #answer .piece').eq(index).text text.slice 0, text.length-1
    ls.animateOracleAnswerTimeoutId = setTimeout ( ->
      animateOracleAnswer line, index, callback
    ), millisecs
  else
    if text.length isnt line.length
      if text.length is 0
        $('#oracle #answer .piece').eq(index).text line.slice 0, 1
      else
        $('#oracle #answer .piece').eq(index).text line.slice 0, text.length+1
      ls.animateOracleAnswerTimeoutId = setTimeout ( ->
        animateOracleAnswer line, index, callback, true
      ), millisecs
    else
      # Animation for this element is complete
      callback index

oraclePrediction = ->
  question = Oracle.predict()
  if question isnt null
    # Add question
    changeOracleQuestion question
    # Add answer
    Oracle.ask question, (answer) ->
      changeOracleAnswer answer
      $('#oracle #question').focus()
  else
    # Tell the user to use the oracle more before using predictions
    $('#oracle #question').focus()
    # The timeout is...well...the timeout is a hack.
    setTimeout ( ->
      changeOracleAnswer Oracle.msgAboutPredict
    ), 200

changeOracleQuestion = (question) ->
  # Stop previous changeOracleAnswer instance, if any
  clearTimeout Number ls.animateOracleQuestionTimeoutId
  # Animate oracle question name change
  animateOracleQuestion question

animateOracleQuestion = (line) ->
  # Animate it
  text = $('#oracle #question').val()
  if text.length is 0
    build = true
  random = Math.floor 100 * Math.random() + 10
  if text.length isnt line.length
    if text.length is 0
      $('#oracle #question').val line.slice 0, 1
    else
      $('#oracle #question').val line.slice 0, text.length+1
    ls.animateOracleQuestionTimeoutId = setTimeout ( ->
      animateOracleQuestion line
    ), random

updateAffiliationNews = (number) ->
  console.lolg 'updateAffiliationNews'+number
  # Displaying the news feed (prefetched by the background page)
  feedItems = ls['affiliationFeedItems'+number]
  # Detect selector
  selector = if number is '1' then '#left' else '#right'
  if ls.showAffiliation2 isnt 'true' then selector = '#full'

  if feedItems isnt undefined
    feedItems = JSON.parse feedItems
    displayItems feedItems, selector, 'affiliationNewsList'+number, 'affiliationViewedList'+number, 'affiliationUnreadCount'+number
  else
    key = ls['affiliationKey'+number]
    name = Affiliation.org[key].name
    $('#news '+selector).html '<div class="post"><div class="item"><div class="title">'+name+'</div>Frakoblet fra nyhetsstrøm</div></div>'
    $('#news '+selector).click ->
      Browser.openTab Affiliation.org[key].web

displayItems = (items, column, newsListName, viewedListName, unreadCountName) ->
  # Empty the news column
  $('#news '+column).html ''
  # Get feedkey
  feedKey = items[0].feedKey

  # Get list of last viewed items and check for news that are just
  # updated rather than being actual news
  newsList = JSON.parse ls[newsListName]
  viewedList = JSON.parse ls[viewedListName]
  updatedList = findUpdatedPosts newsList, viewedList

  # Build list of last viewed for the next time the user views the news
  viewedList = []

  # Prepare the list of images with salt, pepper and some vinegar
  storedImages = JSON.parse ls.storedImages

  # Add feed items to popup
  $.each items, (index, item) ->
    
    if index < newsLimit
      viewedList.push item.link
      
      unreadCount = Number ls[unreadCountName]
      readUnread = ''
      unless Affiliation.org[feedKey].flashyNews
        if index < unreadCount
          if item.link in updatedList.indexOf
            readUnread += '<span class="unread">UPDATED <b>::</b> </span>'
          else
            readUnread += '<span class="unread">NEW <b>::</b> </span>'

      # EXPLANATION NEEDED:
      # .item[data] contains the link
      # .item[name] contains the alternative link, if one exists, otherwise null
      date = altLink = ''
      if item.altLink isnt null
        altLink = ' name="' + item.altLink + '"'
      if item.date isnt null and ls.showAffiliation2 is 'false'
        date = ' den ' + item.date
      descLimit = 140
      if ls.showAffiliation2 is 'true'
        descLimit = 100
      if item.description.length > descLimit
        item.description = item.description.substr(0, descLimit) + '...'
      # Use image we've found to accompany the news item
      storedImage = storedImages[item.link]
      if storedImage isnt undefined
        # Also, check whether there's already a qualified image before replacing it
        if -1 is item.image.indexOf 'http'
          item.image = storedImage

      if Affiliation.org[feedKey].flashyNews and ls.showAffiliation2 is 'true'
        htmlItem = '
          <div class="post">
            <div class="item" data="' + item.link + '"' + altLink + '>
              <img class="flashy" src="' + item.image + '" />
              <div class="title flashy">' + readUnread + item.title + '</div>
              <div class="author flashy">&ndash; Av ' + item.creator + date + '</div>
            </div>
          </div>'
      
      else
        htmlItem = '
          <div class="post">
            <div class="item" data="' + item.link + '"' + altLink + '>
              <div class="title">' + readUnread + item.title + '</div>
              <img class="regular" src="' + item.image + '" />
              ' + item.description + '
              <div class="author">&ndash; Av ' + item.creator + date + '</div>
            </div>
          </div>'
      
      $('#news '+column).append htmlItem
  
  # Store list of last viewed items
  ls[viewedListName] = JSON.stringify viewedList

  # All items are now considered read
  Browser.setBadgeText ''
  ls[unreadCountName] = 0

  # Make news items open extension website while closing popup
  $('#news '+column+' .item').click ->
    # The link is embedded as the ID of the element, we don't want to use
    # <a> anchors because it creates an ugly box marking the focus element.
    # Note that altLinks are embedded in the name-property of the element,
    # - if preferred by the organization, we should use that instead.
    link = $(this).attr 'data'
    altLink = $(this).attr 'name'
    useAltLink = Affiliation.org[feedKey].useAltLink
    if altLink isnt undefined and useAltLink is true
      link = $(this).attr 'name'
    Browser.openTab link
    Analytics.trackEvent 'clickNews', link
    window.close()

  # Update images some times after news are loaded in case of late image updates
  # which are common when the browser has just started Notifier
  times = [100, 500, 1000, 2000, 3000, 5000, 10000]
  for i of times
    setTimeout ( ->
      updateNewsImages()
    ), times[i]

# Checks the most recent list of news against the most recently viewed list of news
findUpdatedPosts = (newsList, viewedList) ->
  updatedList = []
  # Compare lists, keep your mind straight here:
  # Updated news are:
  # - saved in the newsList before the first identical item in the viewedList
  # - saved in the viewedList after the first identical item in the newsList
  for i of newsList
    break if newsList[i] is viewedList[0]
    for j of viewedList
      continue if j is 0
      if newsList[i] is viewedList[j]
        updatedList.push newsList[i]
  return updatedList

updateNewsImages = ->
  console.lolg 'updateNewsImages'
  # The background process looks for images, and sometimes that process
  # isn't finished before the popup loads, that's why we have to check
  # in with localStorage.storedImages a couple of times.
  $.each($('#news .post .item'), (i, val) ->
    link = $(this).attr 'data'
    image = JSON.parse(localStorage.storedImages)[link]
    if image isnt undefined
      $(this).find('img').attr 'src', image
  )

optionsText = (show) ->
  fadeButtonText show, 'Innstillinger'

tipsText = (show) ->
  fadeButtonText show, '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Tips++'

chatterText = (show) ->
  irc = Affiliation.org[ls.affiliationKey1].irc
  text = 'Join ' + irc.channel + ' :)'
  fadeButtonText show, '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ' + text # lol i know ^^

fadeButtonText = (show, msg) ->
  fadeInSpeed = 150
  fadeOutSpeed = 50
  if show
    $('#buttontext').html msg
    $('#buttontext').fadeIn fadeInSpeed
  else
    $('#buttontext').fadeOut fadeOutSpeed
    $('#buttontext').html ''

# Document ready, go!
$ ->
  # If Infoscreen mode is enabled we'll open the infoscreen when the icon is clicked
  if ls.useInfoscreen is 'true'
    Browser.openTab 'infoscreen.html'
    Analytics.trackEvent 'toggleInfoscreen'
    setTimeout ( ->
      window.close()
    ), 250

  # If this is a tiny computer screen, reduce popup height
  if window.screen.availHeight < 700
    shorter = window.screen.availHeight - 100
    # shorter is available screenspace minus the height
    # of the browser taskbar, rounded up well to be sure
    $('body').css 'height', shorter + 'px'

  # If only one affiliation is to be shown remove the second news column
  # Also, some serious statistics
  if ls.showAffiliation2 isnt 'true'
    $('#news #right').hide()
    $('#news #left').attr 'id', 'full'
    # Who uses single affiliations?
    Analytics.trackEvent 'loadSingleAffiliation', ls.affiliationKey1
    # What is the prefered primary affiliation?
    Analytics.trackEvent 'loadAffiliation1', ls.affiliationKey1
  else
    # What kind of double affiliations are used?
    Analytics.trackEvent 'loadDoubleAffiliation', ls.affiliationKey1 + ' - ' + ls.affiliationKey2
    # What is the prefered primary affiliation?
    Analytics.trackEvent 'loadAffiliation1', ls.affiliationKey1
    # What is the prefered secondary affiliation?
    Analytics.trackEvent 'loadAffiliation2', ls.affiliationKey2

  # Hide stuff the user can't or doesn't want to see
  $('#todays').hide() if ls.showOffice isnt 'true'
  $('#cantinas').hide() if ls.showCantina isnt 'true'
  $('#bus').hide() if ls.showBus isnt 'true'

  if ls.affiliationKey1 isnt 'online'
    $('#mobileText').hide() # Hide Notifier Mobile info in Tips box

  # Applying affiliation graphics
  key = ls.affiliationKey1
  logo = Affiliation.org[key].logo
  icon = Affiliation.org[key].icon
  placeholder = Affiliation.org[key].placeholder
  $('#logo').prop 'src', logo
  $('link[rel="shortcut icon"]').attr 'href', icon
  $('#news .post img').attr 'src', placeholder
  $('#chatterIcon').attr 'src', icon

  # Hide Chatter button if not applicable
  if not Affiliation.org[ls.affiliationKey1].irc
    $('#chatterButton').hide()
    $('#chatterIcon').hide()
  
  # Track popularity of the chosen palette, the palette
  # itself is loaded a lot earlier for perceived speed
  Analytics.trackEvent 'loadPalette', ls.affiliationPalette

  # Click events
  $('#logo').click ->
    name = Affiliation.org[ls.affiliationKey1].name
    Analytics.trackEvent 'clickLogo', name
    web = Affiliation.org[ls.affiliationKey1].web
    Browser.openTab web
    window.close()

  $('#optionsButton').click ->
    Browser.openTab 'options.html'
    Analytics.trackEvent 'clickOptions'
    window.close()

  $('#tipsButton').click ->
    if $('#tips').filter(':visible').length is 1
      $('#tips').fadeOut 'fast'
    else
      $('#tips').fadeIn 'fast'
      Analytics.trackEvent 'clickTips'
  $('#tips:not(a)').click ->
    $('#tips').fadeOut 'fast'
  $('#tips a').click ->
    link = $(this).attr 'href'
    Browser.openTab link
    Analytics.trackEvent 'clickTipsLink', link
    window.close()

  $('#chatterButton').click ->
    irc = Affiliation.org[ls.affiliationKey1].irc
    server = irc.server
    channel = irc.channel
    noNick = irc.noNick
    Browser.openTab 'https://kiwiirc.com/client/' + server + '/' + channel
    Analytics.trackEvent 'clickChatter', ls.affiliationKey1
    window.close()

  # Bind realtimebus lines to their timetables
  timetables = JSON.parse(localStorage.busTimetables);
  clickBus = ->
    try
      line = $(this).find('.line').text().trim().split(' ')[0]
      link = timetables[line]
      Browser.openTab link
      Analytics.trackEvent 'clickTimetable'
      window.close()
    catch e
      console.lolg 'ERROR: Failed at clickBus', e
  # Register click event for all lines
  busLanes = ['.first', '.second', '.third']
  for i of busLanes
    $('#bus #firstBus '+busLanes[i]).click clickBus
    $('#bus #secondBus '+busLanes[i]).click clickBus

  # Bind AtB logo and any realtimebus error messages to atb.no
  openAtb = ->
    Browser.openTab 'http://www.atb.no'
    Analytics.trackEvent 'clickAtb'
    window.close()
  $('#bus #atbLogo').click openAtb
  $('#bus .error').click openAtb

  # Bind oracle
  bindOracle()
  $('#oracle #name').click ->
    $('#oracle #question').focus()

  # Bind buttons to hovertext
  $('#optionsButton').mouseenter ->
    optionsText true
  $('#optionsButton').mouseleave ->
    optionsText false

  $('#tipsButton').mouseenter ->
    tipsText true
  $('#tipsButton').mouseleave ->
    tipsText false

  $('#chatterButton').mouseenter ->
    chatterText true
  $('#chatterButton').mouseleave ->
    chatterText false
  $('#chatterIcon').mouseenter ->
    chatterText true
  $('#chatterIcon').mouseleave ->
    chatterText false

  # React to Konami code
  $(document).konami (
    code: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'],
    callback: ->
      Analytics.trackEvent 'toggleKonami'
      # Animate background
      $('head').append '<style type="text/css">
        @-webkit-keyframes adjustHue {
          0% { -webkit-filter: hue-rotate(0deg); }
          10% { -webkit-filter: hue-rotate(36deg); }
          20% { -webkit-filter: hue-rotate(72deg); }
          30% { -webkit-filter: hue-rotate(108deg); }
          40% { -webkit-filter: hue-rotate(144deg); }
          50% { -webkit-filter: hue-rotate(180deg); }
          60% { -webkit-filter: hue-rotate(216deg); }
          70% { -webkit-filter: hue-rotate(252deg); }
          80% { -webkit-filter: hue-rotate(288deg); }
          90% { -webkit-filter: hue-rotate(324deg); }
          100% { -webkit-filter: hue-rotate(360deg); }
        }</style>'
      $('#background').attr 'style','-webkit-animation:adjustHue 10s alternate infinite;'
  )

  # Set the cursor to focus on the question field
  # (e.g. Chrome on Windows doesn't do this automatically so I blatantly blame Windows)
  $('#oracle #question').focus()

  # Enter main loop, keeping everything up-to-date
  stayUpdated = (now) ->
    console.lolg ONLINE_MESSAGE
    loopTimeout = if DEBUG then PAGE_LOOP_DEBUG else PAGE_LOOP
    # Schedule for repetition
    intervalId = setInterval ( ->
      mainLoop()
    ), PAGE_LOOP
    # Run once right now (just wait 2 secs to avoid network-change errors)
    timeout = if now then 0 else 2000
    setTimeout ( ->
      mainLoop true
    ), timeout
  # When offline mainloop is stopped to decrease power consumption
  window.addEventListener 'online', stayUpdated
  window.addEventListener 'offline', ->
    console.lolg OFFLINE_MESSAGE
    clearInterval intervalId
    updateBus()
  # Go
  if navigator.onLine
    stayUpdated true
  else
    mainLoop()
