(function () {
  var defaults = {
      src: 'http://s3-us-west-2.amazonaws.com/porncontainer/videos/37/sprites/vtt.vtt'
    },
    extend = function () {
      var args, target, i, object, property;
      args = Array.prototype.slice.call(arguments);
      target = args.shift() || {};
      for (i in args) {
        object = args[i];
        for (property in object) {
          if (object.hasOwnProperty(property)) {
            if (typeof object[property] === 'object') {
              target[property] = extend(target[property], object[property]);
            }
            else {
              target[property] = object[property];
            }
          }
        }
      }
      return target;
    },
    getComputedStyle = function (el, pseudo) {
      return function (prop) {
        if (window.getComputedStyle) {
          return window.getComputedStyle(el, pseudo)[prop];
        }
        else {
          return el.currentStyle[prop];
        }
      };
    },
    offsetParent = function (el) {
      if (el.nodeName !== 'HTML' && getComputedStyle(el)('position') === 'static') {
        return offsetParent(el.offsetParent);
      }
      return el;
    },
    getVisibleWidth = function (el, width) {
      var clip;

      if (width) {
        return parseFloat(width);
      }

      clip = getComputedStyle(el)('clip');
      if (clip !== 'auto' && clip !== 'inherit') {
        clip = clip.split(/(?:\(|\))/)[1].split(/(?:,| )/);
        if (clip.length === 4) {
          return (parseFloat(clip[1]) - parseFloat(clip[3]));
        }
      }
      return 0;
    },
    getScrollOffset = function () {
      if (window.pageXOffset) {
        return {
          x: window.pageXOffset,
          y: window.pageYOffset
        };
      }
      return {
        x: document.documentElement.scrollLeft,
        y: document.documentElement.scrollTop
      };
    };

  /**
   * register the thubmnails plugin
   */
  videojs.plugin('thumbnails', function (options) {
    var div, settings, img, player, progressControl, duration, moveListener,
      moveCancel;
    settings = extend({}, defaults, options);
    player = this;

    (function () {
      var progressControl, addFakeActive, removeFakeActive;
      // Android doesn't support :active and :hover on non-anchor and non-button elements
      // so, we need to fake the :active selector for thumbnails to show up.
      if (navigator.userAgent.toLowerCase().indexOf("android") !== -1) {
        progressControl = player.controlBar.progressControl;

        addFakeActive = function () {
          progressControl.addClass('fake-active');
        };
        removeFakeActive = function () {
          progressControl.removeClass('fake-active');
        };

        progressControl.on('touchstart', addFakeActive);
        progressControl.on('touchend', removeFakeActive);
        progressControl.on('touchcancel', removeFakeActive);
      }
    })();
    var url = settings['src'];
    settings['base'] = url.substring(0, url.lastIndexOf('/'));
    var ret = {};
    var jsonFile = new XMLHttpRequest();
    jsonFile.open("GET", url, true);
    jsonFile.send();
    progressControl = player.controlBar.progressControl;
    var tmp_div = {};
    var time_seek = document.createElement('div');
    jsonFile.onreadystatechange = function () {
      if (jsonFile.readyState == 4 && jsonFile.status == 200) {
        ret = processWebvtt(jsonFile.responseText);
        // create the thumbnail
        div = document.createElement('div');
        div.className = 'vjs-thumbnail-holder';
        img = document.createElement('div');
        tmp_div = document.createElement('div');
        var current_time = player.currentTime();
        time_seek.innerHTML = current_time;
        time_seek.className = 'vjs-thumbnail-timeseek';
        tmp_div.className = 'vjs-thumbnail-wrapper';
        tmp_div.appendChild(img);
        tmp_div.appendChild(time_seek);
        div.appendChild(tmp_div);


        img.className = 'vjs-thumbnail';
        img.style.height = ret[0].ic.h + 'px'
        img.style.width = ret[0].ic.w + 'px'
        img.style.background = 'url(' + settings['base'] + '/' + ret[0].ina + ') ' + 0 + 'px' + ' ' + 0 + 'px';
        img.style.display = 'inline-block';

        extend(tmp_div.style, settings['src'].style);


        // center the thumbnail over the cursor if an offset wasn't provided
        if (!tmp_div.style.left && !tmp_div.style.right) {
          tmp_div.onload = function () {
            tmp_div.style.left = -(tmp_div.naturalWidth / 2) + 'px';
          };
        }
        // add the thumbnail to the player
        progressControl.el().appendChild(div);
      }
    }


    // keep track of the duration to calculate correct thumbnail to display
    duration = player.duration();

    // when the container is MP4
    player.on('durationchange', function (event) {
      duration = player.duration();
    });

    // when the container is HLS
    player.on('loadedmetadata', function (event) {
      duration = player.duration();
    });


    moveListener = function (event) {
      var elements = document.getElementsByClassName('vjs-time-tooltip')[0];
      time_seek.innerHTML = elements.innerHTML;
      var mouseTime, time, active, left, setting, pageX, right, width,
        halfWidth, pageXOffset, clientRect;
      active = 0;
      pageXOffset = getScrollOffset().x;
      clientRect = offsetParent(progressControl.el()).getBoundingClientRect();
      right = (clientRect.width || clientRect.right) + pageXOffset;

      pageX = event.pageX;
      if (event.changedTouches) {
        pageX = event.changedTouches[0].pageX;
      }

      // find the page offset of the mouse
      left = pageX || (event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft);
      // subtract the page offset of the positioned offset parent
      left -= offsetParent(progressControl.el())
        .getBoundingClientRect().left + pageXOffset;

      // apply updated styles to the thumbnail if necessary
      // mouseTime is the position of the mouse along the progress control bar
      // `left` applies to the mouse position relative to the player so we need
      // to remove the progress control's left offset to know the mouse position
      // relative to the progress control
      mouseTime = parseTime(time_seek.innerHTML);

      var ac = {};
      for (var i = 0; i < ret.length; i++) {
        var el = ret[i];
        if (mouseTime >= el.tf && mouseTime < el.tt) {
          ac = el;
          continue;
        }
      }
      img.style.height = ac.ic.h + 'px'
      img.style.width = (ac.ic.w ) + 'px'
      img.style.background = 'url(' + settings['base'] + '/' + ac.ina + ') ' + -ac.ic.x + 'px' + ' ' + -ac.ic.y + 'px';
      img.style.display = 'inline-block';
      tmp_div.style.top = (-ac.ic.h - 41) + 'px';
      div.style.left = left - (ac.ic.w / 2) + 'px';
    };

    // update the thumbnail while hovering
    progressControl.on('mousemove', moveListener);
    progressControl.on('touchmove', moveListener);

    moveCancel = function (event) {
      div.style.left = '-1000px';
    };

    // move the placeholder out of the way when not hovering
    progressControl.on('mouseout', moveCancel);
    progressControl.on('touchcancel', moveCancel);
    progressControl.on('touchend', moveCancel);
    player.on('userinactive', moveCancel);

    function processWebvtt(webvtt) {

      var segments = webvtt.split('\n\n');
      segments.shift();
      var elements = new Array();
      segments.forEach(function (element) {
        if (element) {
          var e = element.split('\n');
          var t = e[0];
          var ti = t.split(' --> ');
          var tf = parseTime(ti[0]);
          var tt = parseTime(ti[1]);
          var ii = e[1];
          var iii = ii.split('#xywh=');
          var ina = iii[0];
          var ic = iii[1];
          var ica = ic.split(',');
          var icx = ica[0];
          var icy = ica[1];
          var icw = ica[2];
          var ich = ica[3];

          var ret = {};
          ret.tf = tf;
          ret.tt = tt;
          ret.ina = ina;
          ret.ic = {};
          ret.ic.x = icx;
          ret.ic.y = icy;
          ret.ic.w = icw;
          ret.ic.h = ich;
          elements.unshift(ret);
        }
      });
      return elements;
    }

    function parseTime(hours) {

      var a = hours.split(':');
      if (a[2]) {
        return (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
      }
      return ((a[0]) * 60 + (+a[1]));
    }
  });
})();
