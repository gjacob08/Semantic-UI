/*
 * # Semantic - Modal
 * http://github.com/jlukic/semantic-ui/
 *
 *
 * Copyright 2013 Contributors
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ( $, window, document, undefined ) {

$.fn.modal = function(parameters) {
  var
    $allModules = $(this),
    $window     = $(window),
    $document   = $(document),

    time            = new Date().getTime(),
    performance     = [],

    query           = arguments[0],
    methodInvoked   = (typeof query == 'string'),
    queryArguments  = [].slice.call(arguments, 1),

    returnedValue
  ;


  $allModules
    .each(function() {
      var
        settings    = ( $.isPlainObject(parameters) )
          ? $.extend(true, {}, $.fn.modal.settings, parameters)
          : $.extend({}, $.fn.modal.settings),

        selector        = settings.selector,
        className       = settings.className,
        namespace       = settings.namespace,
        error           = settings.error,

        eventNamespace  = '.' + namespace,
        moduleNamespace = 'module-' + namespace,
        moduleSelector  = $allModules.selector || '',

        $module      = $(this),
        $context     = $(settings.context),
        $otherModals = $allModules.not($module),
        $close       = $module.find(selector.close),

        $focusedElement,
        $dimmable,
        $dimmer,

        element      = this,
        instance     = $module.data(moduleNamespace),
        module
      ;

      module  = {

        initialize: function() {
          module.verbose('Initializing dimmer', $context);

          if(typeof $.fn.dimmer === undefined) {
            module.error(error.dimmer);
            return;
          }

          $dimmable = $context
            .dimmer({
              closable : false,
              show     : settings.duration * 0.95,
              hide     : settings.duration * 1.05
            })
            .dimmer('add content', $module)
          ;
          $dimmer = $dimmable
            .dimmer('get dimmer')
          ;

          module.verbose('Attaching close events', $close);
          $close
            .on('click' + eventNamespace, module.event.close)
          ;
          $window
            .on('resize', function() {
              module.event.debounce(module.refresh, 50);
            })
          ;
          module.instantiate();
        },

        instantiate: function() {
          module.verbose('Storing instance of modal');
          instance = module;
          $module
            .data(moduleNamespace, instance)
          ;
        },

        destroy: function() {
          module.verbose('Destroying previous modal');
          $module
            .removeData(moduleNamespace)
            .off(eventNamespace)
          ;
          $close
            .off(eventNamespace)
          ;
          $context
            .dimmer('destroy')
          ;
        },

        refresh: function() {
          module.remove.scrolling();
          module.cacheSizes();
          module.set.type();
          module.set.position();
        },

        attachEvents: function(selector, event) {
          var
            $toggle = $(selector)
          ;
          event = $.isFunction(module[event])
            ? module[event]
            : module.toggle
          ;
          if($toggle.size() > 0) {
            module.debug('Attaching modal events to element', selector, event);
            $toggle
              .off(eventNamespace)
              .on('click' + eventNamespace, event)
            ;
          }
          else {
            module.error(error.notFound);
          }
        },

        event: {
          close: function() {
            module.verbose('Closing element pressed');
            if( $(this).is(selector.approve) ) {
              if($.proxy(settings.onApprove, element)()) {
                module.hide();
              }
              else {
                module.verbose('Approve callback returned false cancelling hide');
              }
            }
            if( $(this).is(selector.deny) ) {
              if($.proxy(settings.onDeny, element)()) {
                module.hide();
              }
              else {
                module.verbose('Deny callback returned false cancelling hide');
              }
            }
            else {
              module.hide();
            }
          },
          click: function(event) {
            module.verbose('Determining if event occured on dimmer', event);
            if( $dimmer.find(event.target).size() === 0 ) {
              module.hide();
              event.stopImmediatePropagation();
            }
          },
          debounce: function(method, delay) {
            clearTimeout(module.timer);
            module.timer = setTimeout(method, delay);
          },
          keyboard: function(event) {
            var
              keyCode   = event.which,
              escapeKey = 27
            ;
            if(keyCode == escapeKey) {
              if(settings.closable) {
                module.debug('Escape key pressed hiding modal');
                module.hide();
              }
              else {
                module.debug('Escape key pressed, but closable is set to false');
              }
              event.preventDefault();
            }
          },
          resize: function() {
            if( $dimmable.dimmer('is active') ) {
              module.refresh();
            }
          }
        },

        toggle: function() {
          if( module.is.active() ) {
            module.hide();
          }
          else {
            module.show();
          }
        },

        show: function() {
          module.showDimmer();
          module.cacheSizes();
          module.set.position();
          module.hideAll();
          if(settings.transition && $.fn.transition !== undefined) {
            $module
              .transition(settings.transition + ' in', settings.duration, module.set.active)
            ;
          }
          else {
            $module
              .fadeIn(settings.duration, settings.easing, module.set.active)
            ;
          }
          module.debug('Triggering dimmer');
          $.proxy(settings.onShow, element)();
        },

        showDimmer: function() {
          module.debug('Showing modal');
          $dimmable.dimmer('show');
        },

        hide: function() {
          if(settings.closable) {
            $dimmer
              .off('click' + eventNamespace)
            ;
          }
          if( $dimmable.dimmer('is active') ) {
            $dimmable.dimmer('hide');
          }
          if( module.is.active() ) {
            module.hideModal();
            $.proxy(settings.onHide, element)();
          }
          else {
            module.debug('Cannot hide modal, modal is not visible');
          }
        },

        hideDimmer: function() {
          module.debug('Hiding dimmer');
          $dimmable.dimmer('hide');
        },

        hideModal: function() {
          module.debug('Hiding modal');
          module.remove.keyboardShortcuts();
          if(settings.transition && $.fn.transition !== undefined) {
            $module
              .transition(settings.transition + ' out', settings.duration, function() {
                module.remove.active();
                module.restore.focus();
              })
            ;
          }
          else {
            $module
              .fadeOut(settings.duration, settings.easing, function() {
                module.remove.active();
                module.restore.focus();
              })
            ;
          }
        },

        hideAll: function() {
          $otherModals
            .filter(':visible')
            .modal('hide')
          ;
        },

        add: {
          keyboardShortcuts: function() {
            module.verbose('Adding keyboard shortcuts');
            $document
              .on('keyup' + eventNamespace, module.event.keyboard)
            ;
          }
        },

        save: {
          focus: function() {
            $focusedElement = $(document.activeElement).blur();
          }
        },

        restore: {
          focus: function() {
            if($focusedElement && $focusedElement.size() > 0) {
              $focusedElement.focus();
            }
          }
        },

        remove: {
          active: function() {
            $module.removeClass(className.active);
          },
          keyboardShortcuts: function() {
            module.verbose('Removing keyboard shortcuts');
            $document
              .off('keyup' + eventNamespace)
            ;
          },
          scrolling: function() {
            $dimmable.removeClass(className.scrolling);
            $module.removeClass(className.scrolling);
          }
        },

        cacheSizes: function() {
          module.cache = {
            height        : $module.outerHeight() + settings.offset,
            contextHeight : (settings.context == 'body')
              ? $(window).height()
              : $dimmable.height()
          };
          module.debug('Caching modal and container sizes', module.cache);
        },

        can: {
          fit: function() {
            return (module.cache.height < module.cache.contextHeight);
          }
        },

        is: {
          active: function() {
            return $module.hasClass(className.active);
          }
        },

        set: {
          active: function() {
            module.add.keyboardShortcuts();
            module.save.focus();
            module.set.type();
            $module
              .addClass(className.active)
            ;
            if(settings.closable) {
              $dimmer
                .on('click' + eventNamespace, module.event.click)
              ;
            }
          },
          scrolling: function() {
            $dimmable.addClass(className.scrolling);
            $module.addClass(className.scrolling);
          },
          type: function() {
            if(module.can.fit()) {
              module.verbose('Modal fits on screen');
              module.remove.scrolling();
            }
            else {
              module.verbose('Modal cannot fit on screen setting to scrolling');
              module.set.scrolling();
            }
          },
          position: function() {
            module.verbose('Centering modal on page', module.cache, module.cache.height / 2);
            if(module.can.fit()) {
              $module
                .css({
                  top: '',
                  marginTop: -(module.cache.height / 2)
                })
              ;
            }
            else {
              $module
                .css({
                  marginTop : '1em',
                  top       : $document.scrollTop()
                })
              ;
            }
          }
        },

        setting: function(name, value) {
          if( $.isPlainObject(name) ) {
            $.extend(true, settings, name);
          }
          else if(value !== undefined) {
            settings[name] = value;
          }
          else {
            return settings[name];
          }
        },
        internal: function(name, value) {
          if( $.isPlainObject(name) ) {
            $.extend(true, module, name);
          }
          else if(value !== undefined) {
            module[name] = value;
          }
          else {
            return module[name];
          }
        },
        debug: function() {
          if(settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.debug.apply(console, arguments);
            }
          }
        },
        verbose: function() {
          if(settings.verbose && settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.verbose.apply(console, arguments);
            }
          }
        },
        error: function() {
          module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
          module.error.apply(console, arguments);
        },
        performance: {
          log: function(message) {
            var
              currentTime,
              executionTime,
              previousTime
            ;
            if(settings.performance) {
              currentTime   = new Date().getTime();
              previousTime  = time || currentTime;
              executionTime = currentTime - previousTime;
              time          = currentTime;
              performance.push({
                'Element'        : element,
                'Name'           : message[0],
                'Arguments'      : [].slice.call(message, 1) || '',
                'Execution Time' : executionTime
              });
            }
            clearTimeout(module.performance.timer);
            module.performance.timer = setTimeout(module.performance.display, 100);
          },
          display: function() {
            var
              title = settings.name + ':',
              totalTime = 0
            ;
            time = false;
            clearTimeout(module.performance.timer);
            $.each(performance, function(index, data) {
              totalTime += data['Execution Time'];
            });
            title += ' ' + totalTime + 'ms';
            if(moduleSelector) {
              title += ' \'' + moduleSelector + '\'';
            }
            if( (console.group !== undefined || console.table !== undefined) && performance.length > 0) {
              console.groupCollapsed(title);
              if(console.table) {
                console.table(performance);
              }
              else {
                $.each(performance, function(index, data) {
                  console.log(data['Name'] + ': ' + data['Execution Time']+'ms');
                });
              }
              console.groupEnd();
            }
            performance = [];
          }
        },
        invoke: function(query, passedArguments, context) {
          var
            maxDepth,
            found,
            response
          ;
          passedArguments = passedArguments || queryArguments;
          context         = element         || context;
          if(typeof query == 'string' && instance !== undefined) {
            query    = query.split(/[\. ]/);
            maxDepth = query.length - 1;
            $.each(query, function(depth, value) {
              var camelCaseValue = (depth != maxDepth)
                ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                : query
              ;
              if( $.isPlainObject( instance[value] ) && (depth != maxDepth) ) {
                instance = instance[value];
              }
              else if( $.isPlainObject( instance[camelCaseValue] ) && (depth != maxDepth) ) {
                instance = instance[camelCaseValue];
              }
              else if( instance[value] !== undefined ) {
                found = instance[value];
                return false;
              }
              else if( instance[camelCaseValue] !== undefined ) {
                found = instance[camelCaseValue];
                return false;
              }
              else {
                module.error(error.method);
                return false;
              }
            });
          }
          if ( $.isFunction( found ) ) {
            response = found.apply(context, passedArguments);
          }
          else if(found !== undefined) {
            response = found;
          }
          if($.isArray(returnedValue)) {
            returnedValue.push(response);
          }
          else if(returnedValue !== undefined) {
            returnedValue = [returnedValue, response];
          }
          else if(response !== undefined) {
            returnedValue = response;
          }
          return found;
        }
      };

      if(methodInvoked) {
        if(instance === undefined) {
          module.initialize();
        }
        module.invoke(query);
      }
      else {
        if(instance !== undefined) {
          module.destroy();
        }
        module.initialize();
      }
    })
  ;

  return (returnedValue !== undefined)
    ? returnedValue
    : this
  ;
};

$.fn.modal.settings = {

  name        : 'Modal',
  namespace   : 'modal',
  verbose     : true,
  debug       : true,
  performance : true,

  closable    : true,
  context     : 'body',
  duration    : 500,
  easing      : 'easeOutExpo',
  offset      : 0,
  transition  : 'scale',

  onShow      : function(){},
  onHide      : function(){},
  onApprove   : function(){ return true; },
  onDeny      : function(){ return true; },

  selector    : {
    close    : '.close, .actions .button',
    approve  : '.actions .positive, .actions .approve',
    deny     : '.actions .negative, .actions .cancel'
  },
  error : {
    dimmer    : 'UI Dimmer, a required component is not included in this page',
    method    : 'The method you called is not defined.'
  },
  className : {
    active    : 'active',
    scrolling : 'scrolling'
  },
};


})( jQuery, window , document );