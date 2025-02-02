'use strict'

function getPlugin () {
  const ClassNames = {
      Full: 'view-in--full',
      In: 'view-in',
      GtHalf: 'view-in--gt-half',
      GtThird: 'view-in--gt-third',
      Out: 'view-out',
      Above: 'view-out--above',
      Below: 'view-out--below'
    },
    EventTypes = {
      Enter: 'enter',
      Exit: 'exit',
      Progress: 'progress'
    }

  function throttle(handler, timeout = 0) {
    if (!handler || typeof handler !== 'function') throw new Error('Throttle handler argument is not incorrect. Must be a function.')
    let timeoutTime = 0
    return function (e) {
      if (timeoutTime) return
      timeoutTime = setTimeout(() => {
        timeoutTime = 0
        handler(e)
      }, timeout)
    }
  }

  function roundPercent(v) {
    return (v * 1000 | 0) / 1000
  }

  function createInstance(Vue, options) {
    const items = {},
      scrollThrottledHandler = throttle(scrollHandler, 40)

    let scrollValue = window.pageYOffset,
      itemIndex = 0

    window.addEventListener('scroll', scrollThrottledHandler)
    window.addEventListener('resize', scrollThrottledHandler)

    function scrollHandler(e) {
      let viewportTop = window.pageYOffset,
        viewportBottom = window.pageYOffset + window.document.documentElement.clientHeight,
        viewportHeight = window.document.documentElement.clientHeight,
        documentHeight = window.document.documentElement.scrollHeight,
        scrollPercent = roundPercent(window.pageYOffset / (documentHeight - viewportHeight))

      scrollValue = viewportTop - scrollValue

      function getInType(i) {
        const rect = i.element.getBoundingClientRect(),
          elementTop = rect.top + viewportTop,
          elementBottom = elementTop + rect.height,
          topIn = elementTop > viewportTop && elementTop < viewportBottom,
          bottomIn = elementBottom > viewportTop && elementBottom < viewportBottom,
          percentInView = topIn || bottomIn ? ((bottomIn ? elementBottom : viewportBottom) - (topIn ? elementTop : viewportTop)) / rect.height : 0,
          centerPercent = (elementTop - viewportTop + rect.height / 2) / viewportHeight,
          zeroPoint = viewportTop - rect.height,
          topPercent = (elementTop - zeroPoint) / (viewportBottom - zeroPoint),
          isAbove = percentInView === 0 && elementTop < viewportTop,
          isBelow = percentInView === 0 && elementTop > viewportTop

        return [(topIn ? 1 : 0) | (bottomIn ? 2 : 0) | (isAbove ? 4 : 0) | (isBelow ? 8 : 0), roundPercent(percentInView), roundPercent(centerPercent), roundPercent(topPercent), rect]
      }

      for (let id in items) {
        const i = items[id],
          [type, percentInView, percentCenter, percentTop, rect] = getInType(i),
          classes = i.classes,
          classList = i.element.classList,
          inViewChange = i.percent <= 0 && percentInView,
          outViewChange = i.percent && percentInView === 0

        if (percentInView === 0 && i.percent === 0) continue
        i.rect = rect

        let eventType = (inViewChange && EventTypes.Enter) || (outViewChange && EventTypes.Exit) || EventTypes.Progress

        Object.keys(classes).forEach(v => (classes[v] = false))

        if (percentInView >= 0.5) {
          classes[ClassNames.GtHalf] = true
        }
        else if (percentInView >= 0.3) {
          classes[ClassNames.GtThird] = true
        }

        if (type === 8) {
          classes[ClassNames.Below] = true
          classes[ClassNames.Out] = true
        }
        else if (type === 4) {
          classes[ClassNames.Above] = true
          classes[ClassNames.Out] = true
        }
        else if (type === 3) {
          classes[ClassNames.Full] = true
          classes[ClassNames.In] = true
        }
        else if (type === 1) {
          classes[ClassNames.In] = true
        }
        else if (type === 2) {
          classes[ClassNames.In] = true
        }

        Object.keys(classes).forEach(n => {
          classList.toggle(n, classes[n])
          if (!classes[n]) delete classes[n]
        })

        if (typeof i.handler === 'function') {
          i.handler({type: eventType, percentInView, percentTop, percentCenter, scrollPercent, scrollValue, target: i})
        }

        if (typeof i.onceenter === 'function' && eventType === EventTypes.Enter) {
          i.onceenter({
            type: eventType,
            percentInView,
            percentTop,
            percentCenter,
            scrollPercent,
            scrollValue,
            target: i
          })
          delete i.onceenter
        }

        i.percent = percentInView
      }

      scrollValue = viewportTop
    }

    Vue.directive('view', {
      unbind: function (element, bind) {
        delete items[element.$scrollId]
      },
      inserted: function (element, bind) {
        let id = element.$scrollId || ('scrollId-' + itemIndex++),
          item = items[id] || {element: element, classes: {}, percent: -1, rect: {}}

        if (bind.modifiers && bind.modifiers.once) {
          item.onceenter = bind.value
        }
        else {
          item.handler = bind.value
        }

        element.$scrollId = id
        items[id] = item
        scrollThrottledHandler()
      }
    })
  }

  return {
    install: function (Vue, options) {
      Vue.directive('view', Vue.prototype.$isServer ? {} : createInstance(Vue, options))
    }
  }
}

if (typeof exports === 'object' && typeof module !== 'undefined') {
  module.exports = getPlugin()
}
else {
  if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(getPlugin(), {option: 'custom option of client'})
  }
}
