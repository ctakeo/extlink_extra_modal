(function ($) {

// Checks if a given element resides in default extra leaving container page.
function isInExtraLeavingContainer(element) {
  return $(element).closest('div.extlink-extra-leaving').length > 0;
}

Drupal.settings.extlink_extra.colorboxSettings = Drupal.settings.extlink_extra.colorboxSettings || {
  href: Drupal.settings.extlink_extra.extlink_alert_url + ' .extlink-extra-leaving',
  height: '50%',
  width: '50%',
  initialWidth: '50%',
  initialHeight: '50%',
  className: 'extlink-extra-leaving-colorbox',
  onComplete: function () { // Note - drupal colorbox module automatically attaches drupal behaviors to loaded content.
    // Allow our cancel link to close the colorbox.
    jQuery('div.extlink-extra-back-action a').click(function(e) {jQuery.colorbox.close(); return false;})
    extlink_extra_timer();
  },
  onClosed: extlink_stop_timer
};

Drupal.behaviors.extlink_extra = {
  // Function mostly duplicated from extlink.js.
  // Returns an array of DOM elements of all external links.
  extlinkAttach: function(context) {
    var settings = Drupal.settings;

    if (!settings.hasOwnProperty('extlink')) {
      return;
    }

    // Strip the host name down, removing ports, subdomains, or www.
    var pattern = /^(([^\/:]+?\.)*)([^\.:]{4,})((\.[a-z]{1,4})*)(:[0-9]{1,5})?$/;
    var host = window.location.host.replace(pattern, '$3$4');
    var subdomain = window.location.host.replace(pattern, '$1');

    // Determine what subdomains are considered internal.
    var subdomains;
    if (settings.extlink.extSubdomains) {
      subdomains = "([^/]*\\.)?";
    }
    else if (subdomain == 'www.' || subdomain == '') {
      subdomains = "(www\\.)?";
    }
    else {
      subdomains = subdomain.replace(".", "\\.");
    }

    // Build regular expressions that define an internal link.
    var internal_link = new RegExp("^https?://" + subdomains + host, "i");

    // Extra internal link matching.
    var extInclude = false;
    if (settings.extlink.extInclude) {
      extInclude = new RegExp(settings.extlink.extInclude.replace(/\\/, '\\'), "i");
    }

    // Extra external link matching.
    var extExclude = false;
    if (settings.extlink.extExclude) {
      extExclude = new RegExp(settings.extlink.extExclude.replace(/\\/, '\\'), "i");
    }

    // Extra external link CSS selector exclusion.
    var extCssExclude = false;
    if (settings.extlink.extCssExclude) {
      extCssExclude = settings.extlink.extCssExclude;
    }

    // Extra external link CSS selector explicit.
    var extCssExplicit = false;
    if (settings.extlink.extCssExplicit) {
      extCssExplicit = settings.extlink.extCssExplicit;
    }

    // Find all links which are NOT internal and begin with http as opposed
    // to ftp://, javascript:, etc. other kinds of links.
    // When operating on the 'this' variable, the host has been appended to
    // all links by the browser, even local ones.
    // In jQuery 1.1 and higher, we'd use a filter method here, but it is not
    // available in jQuery 1.0 (Drupal 5 default).
    var external_links = new Array();
    var mailto_links = new Array();
    $("a, area", context).each(function(el) {
      try {
        var url = this.href.toLowerCase();
        if (url.indexOf('http') == 0
          && (!url.match(internal_link) && !(extExclude && url.match(extExclude)))
          || (extInclude && url.match(extInclude))
          && !(extCssExclude && $(this).parents(extCssExclude).length > 0)
          && !(extCssExplicit && $(this).parents(extCssExplicit).length < 1)) {

          // Add a class of 'extlink' to all external links except those within
          // the 'now leaving' area.
          if (!isInExtraLeavingContainer(this)) {
            $(this).addClass('extlink');
          }

          external_links.push(this);
        }
        // Do not include area tags with begin with mailto: (this prohibits
        // icons from being added to image-maps).
        else if (this.tagName != 'AREA'
          && url.indexOf('mailto:') == 0
          && !(extCssExclude && $(this).parents(extCssExclude).length > 0)
          && !(extCssExplicit && $(this).parents(extCssExplicit).length < 1)) {
          mailto_links.push(this);
        }
      }
        // IE7 throws errors often when dealing with irregular links, such as:
        // <a href="node/10"></a> Empty tags.
        // <a href="http://user:pass@example.com">example</a> User:pass syntax.
      catch (error) {
        return false;
      }
    });
    return external_links;
  },

  // Our click handler for external links.
  clickReaction: function(e) {
    $(document).unbind('cbox_complete');
    // Allow the default behavior for link if it's within the warning area.
    // This keeps us from firing an infinite loop of reactions.
    e.preventDefault();
    e.stopPropagation();
    if (isInExtraLeavingContainer(this)) {
      return true;
    }

    var external_url = jQuery(this).attr('href');
    var back_url = window.location.href;
    var alerturl = Drupal.settings.extlink_extra.extlink_alert_url;
    var exceptions_list = Drupal.settings.extlink_extra.extlink_exceptions_list

    // "Don't warn" pattern matching.
    var extlink_exclude_warning = false;
    if (Drupal.settings.extlink_extra.extlink_exclude_warning) {
      extlink_exclude_warning = new RegExp(Drupal.settings.extlink_extra.extlink_exclude_warning.replace(/\\/, '\\'));
    }
    // Don't do any warnings if the href matches the "don't warn" pattern.
    if (extlink_exclude_warning) {
      var url = external_url.toLowerCase();
      if (url.match(extlink_exclude_warning)) {
        return true;
      }
    }

    // This is what extlink does by default (except
    if (Drupal.settings.extlink_extra.extlink_alert_type == 'confirm') {
      var text = Drupal.settings.extlink.extAlertText.value;
      text = text.replace(/\[extlink:external\-url\]/gi, external_url);
      text = text.replace(/\[extlink:back-url\]/gi, back_url);
      return confirm(text);
    }

    // Set cookies that the modal or page can read to determine the 'go to' and 'back' links.
    $.cookie("external_url", external_url, { path: '/' });
    $.cookie("back_url", back_url, { path: '/' });

    if (Drupal.settings.extlink_extra.extlink_alert_type == 'colorbox') {
      $.colorbox({
          className: "extlink-extra-leaving-colorbox",
          height: "50%",
          href: Drupal.settings.extlink_extra.extlink_alert_url+ " .extlink-extra-leaving",
          initialHeight: "50%",
          initialWidth: "50%",
          onComplete: function (){
            var extlink_extra = Drupal.settings.extlink_extra;
            var exceptions_list = Drupal.settings.extlink_extra.extlink_exceptions_list;
            var newTab = false;
            if (Drupal.settings.extlink.extTarget != 0) {
              var newTab = true;
            }
            if (extlink_extra.extlink_exceptions == 'yes') {
              for (var i = 0; i < exceptions_list.length; i++) {
                if ($(document).has(exceptions_list[i].title).length > 0) {
                  if ($(exceptions_list[i].title).has(e.currentTarget).length > 0) {  //If the user clicked a link included in the exception list
                    $('.extlink-extra-leaving').html(exceptions_list[i].text);
                    appendButtons(back_url, external_url, newTab);
                    //Switch to check if the function passed in the configuration panel really exists
                    switch ($.isFunction(window[exceptions_list[i].cancel_callback])) {
                      case false:
                        break;
                      case true:
                        $('.extlink-extra-leaving [value="Back"]').attr('onclick', exceptions_list[i].cancel_callback + '(); redirect(\'back\',\'' + back_url + '\', ' + newTab + ');');
                        break;
                    }
                    //Same as above
                    switch ($.isFunction(window[exceptions_list[i].go_callback])) {
                      case false:
                        $('.extlink-extra-leaving [value="Go"]').attr('onclick', 'redirect(\'go\',\'' + external_url + '\', ' + newTab + ');');
                        break;
                      case true:
                        $('.extlink-extra-leaving [value="Go"]').attr('onclick', exceptions_list[i].go_callback+'(); redirect(\'go\',\'' + external_url + '\', ' + newTab + ');');
                        break;
                    }
                    break;
                  }
                  else {  //If the exceptions are active but the user didn't click a link included in the exception link
                    //Instead of modifying the whole content whe just append the button code
                    appendButtons(back_url, external_url, newTab);
                  }
                }
              }
            }
            else {
              appendButtons(back_url, external_url, newTab);
            }
          },
          width: "50%",
        });

      return false;
    }

    if (Drupal.settings.extlink_extra.extlink_alert_type == 'bootstrap') {
      //If the template is not appended yet
      if ($('body').has('#extlink-extra-leaving-bootstrap-modal').length == 0) {
        //Make an ajax request
        $.get( Drupal.settings.basePath+"now-leaving-bs", function( data ) {
          var mustAddHandlers = false;
          var modal = $('.extlink-extra-leaving', data);
          $( "body" ).append( modal );
          $('#extlink-extra-leaving-bootstrap-modal').css('-ms-overflow-style', 'none');
          $('#extlink-extra-leaving-bootstrap-modal').css('overflow-y', 'auto');
          if (Drupal.settings.extlink_extra.extlink_exceptions == 'yes') {
            for (var i = 0; i < exceptions_list.length; i++) {
              if ($(document).has(exceptions_list[i].title).length > 0) {
                if ($(exceptions_list[i].title).has(e.currentTarget).length > 0) {
                  //Avoid copy and paste
                  changeModalContent(e, external_url);
                }
                else {
                  //Avoid copy and paste
                  mustAddHandlers = true;
                }
              }
            }
          }
          else {
            //Avoid copy and paste
            mustAddHandlers = true;
          }
          //The must mustAddHandlers works if:
          // * The exceptions are active but the user did not click a link included in the list
          // * Exceptions are not active.
          //Either way the message shown will be the same.
          if (mustAddHandlers) {
            $('#extlink-extra-leaving-bootstrap-modal #modal-go-button').on('click', function() {
              if (Drupal.settings.extlink.extTarget != 0) { //If the user selected to open the links in a new tab
                redirect('go', external_url, true);
              }
              else {
                redirect('go', external_url, false);
              }
              //After the modal closes we remove it from the html. Doing this avoid a lot of copy and paste.
              $('.extlink-extra-leaving').remove();
              $('.modal-backdrop').remove();
            });

            $('#extlink-extra-leaving-bootstrap-modal #modal-close-button').on('click', function() {
              //After the modal closes we remove it from the html. Doing this avoid a lot of copy and paste.
              $('.extlink-extra-leaving').remove();
              $('.modal-backdrop').remove();
            });
          }
          //Show the modal
          $('#extlink-extra-leaving-bootstrap-modal').modal('show');
        });
      }
      else {
        $('#extlink-extra-leaving-bootstrap-modal #modal-go-button').off('click');
        $('#extlink-extra-leaving-bootstrap-modal #modal-go-button').on('click', function() {
          if (Drupal.settings.extlink.extTarget != 0) { //If the user selected to open the links in a new tab
            redirect('go', external_url, true);
          }
          else {
            redirect('go', external_url, false);
          }
          //After the modal closes we remove it from the html. Doing this avoid a lot of copy and paste.
          $('.extlink-extra-leaving').remove();
          $('.modal-backdrop').remove();
        });
        if (Drupal.settings.extlink_extra.extlink_exceptions == 'yes') {
          for (var i = 0; i < exceptions_list.length; i++) {
            if ($(document).has(exceptions_list[i].title).length > 0) {
              if ($(exceptions_list[i].title).has(e.currentTarget).length > 0) {
                //Avoid copy and paste
                changeModalContent(e, external_url);
              }
              else {
                changeModalContent(e, external_url);
                //Avoid copy and paste
                mustAddHandlers = true;
              }
            }
          }
        }
        //Show the modal
        $('#extlink-extra-leaving-bootstrap-modal').modal('show');
      }
    }

    if (Drupal.settings.extlink_extra.extlink_alert_type == 'page') {
      // If we're here, alert text is on but pop-up is off; we should redirect to an intermediate confirm page.
      window.location = alerturl;
      return false;
    }
  },

  attach: function(context){
    // Build an array of external_links exactly like extlink does.
    var external_links = this.extlinkAttach(context);

    // Unbind the click handlers added by extlink and replace with our own
    // This whole section of code that does the finding, unbinding, and rebinding
    // could be made a lot less redundant and more efficient if this issue could be resolved: http://drupal.org/node/1715520
    $(external_links).unbind('click').not('.ext-override, .extlink-extra-leaving a').click(this.clickReaction);

    $(document).ready(function() {
      if (Drupal.settings.extlink_extra.extlink_url_override == 1) {
        if (Drupal.settings.extlink_extra.extlink_url_params.external_url) {
          $.cookie("external_url", Drupal.settings.extlink_extra.extlink_url_params.external_url, { path: '/' });
        }
        if (Drupal.settings.extlink_extra.extlink_url_params.back_url) {
          $.cookie("back_url", Drupal.settings.extlink_extra.extlink_url_params.back_url, { path: '/' });
        }
      }
    });

    // Dynamically replace hrefs of back and external links on page load. This
    // is to compensate for aggressive caching situations where the now-leaving
    // is returning cached results.
    if (Drupal.settings.extlink_extra.extlink_cache_fix == 1) {
      if (jQuery('.extlink-extra-leaving').length > 0) {
        // grab our cookies
        var external_url = $.cookie("external_url");
        var back_url = $.cookie("back_url");

        // First, find any links within the .extlink-extra-leaving area that use our placeholder text and set their HREFs.
        // Using jquery's attr function here (rather than text replace) is important because IE7 or (IE10+ in
        // compatibility mode, possibly others) will have already turned link HREFs with a value of
        // "external-url-placeholder" into a fully qualified link that has protocol and domain prepended, so we need to
        // replace the whole thing.
        $goLinks = jQuery('.extlink-extra-leaving a[href*=external-url-placeholder]').attr('href', external_url);
        $backLinks = jQuery('.extlink-extra-leaving a[href*=back-url-placeholder]').attr('href', back_url);

        // Respect the 'Open external links in a new window' in our modal/page with aggressive caching.  Use of the text
        // placeholder means that extlink's attach function doesn't catch these.
        if (Drupal.settings.extlink.extTarget) {
          // Apply the 'target' attribute to the 'go' links.
          $goLinks.attr('target', Drupal.settings.extlink.extTarget);
        }

        // Next find any other places within text or whatever that have the placeholder text.
        var html = jQuery('.extlink-extra-leaving').html();
        html = html.replace(/external-url-placeholder/gi, external_url);
        html = html.replace(/back-url-placeholder/gi, back_url);
        jQuery('.extlink-extra-leaving').html(html);
      }
    }

    // If the timer is configured, we'll call it for the intermediate page.
    if (Drupal.settings.extlink_extra.extlink_alert_type == 'page') {
      if (jQuery('.extlink-extra-leaving').length > 0) {
        extlink_extra_timer();
      }
    }

    // Apply 508 fix - extlink module makes empty <spans> to show the external link icon, screen readers
    // have trouble with this.
    if (Drupal.settings.extlink_extra.extlink_508_fix == 1) {
      // Go through each <a> tag with an 'ext' class,
      $.each($("a.ext"), function(index, value) {
        // find a <span> next to it with 'ext' class,
        var nextSpan = $(this).next('span.ext');
        if (nextSpan.length) {
          // if found add the text 'External Link' to the empty <span> (or whatever is configured by the user)
          nextSpan.html(Drupal.settings.extlink_extra.extlink_508_text);

          // and move the span inside the <a> tag (at the end).
          $(this).append(nextSpan);
        }
      });
    }

    if (Drupal.settings.extlink_extra.extlink_alert_type == 'bootstrap') {
      //Go to every link included by the module
      $.each($("a.ext"), function(index, value) {
        //Add the data-toggle attribute. Without this the page will not wait until the user clicks go.
        $(this).attr('data-toggle', 'modal');
      });
    }
  }
}

function appendButtons(back_url, external_url, newTab) {
  $('.extlink-extra-leaving').append('<div class="colorboxButtonWrapper" style="vertical-align:bottom; color:red; height:100%">'+
                                      '<div class="colorboxButton-back" style="width:50%; float:left;">'+
                                        '<button value="Back" class="btn btn-default" style="float:right; margin-right: 10px;" onclick="redirect(\'back\',\'' + back_url + '\', ' + newTab + ');">Back</button>'+
                                      '</div>'+
                                      '<div class="colorboxButton-go" style="width:50%; float:right;">'+
                                        '<button value="Go" class="btn btn-default" style="float:left; margin-left:10px;" onclick="redirect(\'go\',\'' + external_url + '\', ' + newTab + ');">Go</button>'+
                                      '</div>'+
                                    '</div>');
}

function changeModalContent (e, external_url) {
  var exceptions_list = Drupal.settings.extlink_extra.extlink_exceptions_list;
  for (var i = 0; i < exceptions_list.length; i++) {
    if ($(document).has(exceptions_list[i].title).length > 0) {
      if ($(exceptions_list[i].title).has(e.currentTarget).length > 0) {
        $('#extlink-extra-leaving-bootstrap-modal .modal-body').html(exceptions_list[i].text);
        $('#extlink-extra-leaving-bootstrap-modal #modal-close-button').off();
        $('#extlink-extra-leaving-bootstrap-modal #modal-go-button').off();
        //Check if the function passed in the configuration panel really exists
        switch($.isFunction(window[exceptions_list[i].go_callback])) {
            case false:
                $('#extlink-extra-leaving-bootstrap-modal #modal-go-button').on('click', function() {
                  if (Drupal.settings.extlink.extTarget != 0) {
                    redirect('go', external_url, true);
                  }
                  else {
                    redirect('go', external_url, false);
                  }
                  //After the modal closes we remove it from the html. Doing this avoid a lot of copy and paste.
                  $('.extlink-extra-leaving').remove();
                  $('.modal-backdrop').remove();
                });
                break;
            case true:
              $('#extlink-extra-leaving-bootstrap-modal #modal-go-button').on('click', function() {
                //Here we call the custom function
                window[exceptions_list[i].go_callback]();
                if (Drupal.settings.extlink.extTarget != 0) {
                  redirect('go', external_url, true)
                }
                else {
                  redirect('go', external_url, false);
                }
                //After the modal closes we remove it from the html. Doing this avoid a lot of copy and paste.
                $('.extlink-extra-leaving').remove();
                $('.modal-backdrop').remove();
              });
        }
        //Check if the function passed in the configuration panel really exists
        switch($.isFunction(window[exceptions_list[i].cancel_callback])) {
            case false:
                $('#extlink-extra-leaving-bootstrap-modal #modal-close-button').on('click', function() {
                  //After the modal closes we remove it from the html. Doing this avoid a lot of copy and paste.
                  $('.extlink-extra-leaving').remove();
                  $('.modal-backdrop').remove();
                });
                break;
            case true:
              $('#extlink-extra-leaving-bootstrap-modal #modal-close-button').on('click', function() {
                //Here we call the custom function
                window[exceptions_list[i].cancel_callback]();
                //After the modal closes we remove it from the html. Doing this avoid a lot of copy and paste.
                $('.extlink-extra-leaving').remove();
                $('.modal-backdrop').remove();
              });
        }
        break;
      }
      else {
        $('#extlink-extra-leaving-bootstrap-modal .modal-body').html(Drupal.settings.extlink_extra.extlink_alert_text.value);
      }
    }
  }
}


})(jQuery);

// Global var that will be our JS interval.
var extlink_int;

//This is going to redirect the user to a link
function redirect( whatShouldIDo, whereTo, newTab ) {
  if (whatShouldIDo == 'go') {
    if (newTab) {
      window.open(whereTo, '_blank');
    }
    else {
      window.location = whereTo;
    }
    jQuery.colorbox.close();
  }
  else {
    jQuery.colorbox.close();
  }
}

function extlink_extra_timer() {
  if (Drupal.settings.extlink_extra.extlink_alert_timer == 0 || Drupal.settings.extlink_extra.extlink_alert_timer == null) {
    return;
  }
  extlink_int = setInterval(function () {
    var container = jQuery('.automatic-redirect-countdown');
    var count = container.attr('rel');
    if (count == null) {
      count = Drupal.settings.extlink_extra.extlink_alert_timer;
    }
    if (count >= 0) {
      container.html('<span class="extlink-timer-text">Automatically redirecting in: </span><span class="extlink-count">' + count + '</span><span class="extlink-timer-text"> seconds.</span>');
      container.attr('rel', --count);
    }
    else {
      extlink_stop_timer();
      container.remove();
      window.location = jQuery('div.extlink-extra-go-action a').attr('href');
    }
  }, 1000);
}

function extlink_stop_timer() {
  clearInterval(extlink_int);
}
