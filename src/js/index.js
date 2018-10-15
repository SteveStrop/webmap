window.addEventListener('load', initMap)
google.maps.InfoWindowZ = function (opts) {
  const GOOGLE_MAP = google.maps
  const MAP_EVENT = GOOGLE_MAP.event
  const INFO_WINDOW = new GOOGLE_MAP.InfoWindow()
  let markerClickEvent
  if (!GOOGLE_MAP.InfoWindowZZ) {
    GOOGLE_MAP.InfoWindowZZ = Number(GOOGLE_MAP.Marker.MAX_ZINDEX)
  }

  MAP_EVENT.addListener(INFO_WINDOW, 'content_changed', function () {
    if (typeof this.getContent() === 'string') {
      var n = document.createElement('div')
      n.innerHTML = this.getContent()
      this.setContent(n)
      return
    }
    MAP_EVENT.addListener(this, 'domready',
      function () {
        const _this = this
        this.setZIndex(++GOOGLE_MAP.InfoWindowZZ)
        if (markerClickEvent) {
          GOOGLE_MAP.event.removeListener(markerClickEvent)
        }
        markerClickEvent = MAP_EVENT.addDomListener(_this.getContent().parentNode.parentNode.parentNode, 'click',
          function () {
            _this.setZIndex(++GOOGLE_MAP.InfoWindowZZ)
          })
        console.log(markerClickEvent)
      })
  })
  if (opts) INFO_WINDOW.setOptions(opts)
  return INFO_WINDOW
}

// start inject
const POSTCODES = [

]
const DAY_COLORS = [

]
const BUBBLE_CONTENTS = [
]
const LEGEND_TEXT = [

]
// end inject

const DOM = {
  map: document.getElementById('map'),
  progressBar: document.getElementById('myBar')
}
const latLangMK = { lat: 52.003486, lng: -0.80137 }
const GEOCODER = new google.maps.Geocoder()
const DROP_DELAY = 400 // sets the delay between marker drops
const markers = []
const INFO_BUBBLE = []
const MAP_FEATURE_STYLES = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ lightness: 40 }]
  },
  {
    featureType: 'poi.park',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text',
    stylers: [{ color: '#bbbbbb' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'off' }]
  }
]
const BOUNDS = new google.maps.LatLngBounds()
let count = 0
let maxWidth = 0
let map

function initMap () {
  for (let i = 0; i < POSTCODES.length; i++) {
    getLatLng(POSTCODES, i, GEOCODER) // convert POSTCODES to geocodes
  }
  // draw the map while still fetching geocodes
  map = new google.maps.Map(DOM.map, {
    mapTypeControl: false,
    center: new google.maps.LatLng(latLangMK),
    zoom: 12,
    scaleControl: true,
    zoomControl: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: MAP_FEATURE_STYLES
  })
  // Create the Legend DIV
  const controlUI = document.createElement('div')
  controlUI.classList.add('controlUI')
  controlUI.innerHTML = LEGEND_TEXT
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlUI)
}

const drop = () => {
  document.getElementById('map').style.visibility = 'visible'
  document.getElementById('loading').style.height = '0px'
  for (var i = 0; i < POSTCODES.length; i++) {
    addMarkerWithTimeout(i, POSTCODES[i].position, POSTCODES[i].fillColor, POSTCODES[i].title, POSTCODES[i].content, i * DROP_DELAY)
  }
}

const addMarkerWithTimeout = (i, position, fillColor, title, contents, dropDelay) => {
  window.setTimeout(function () {
    INFO_BUBBLE[i] = new google.maps.InfoWindowZ({
      content: contents
    })
    markers[i] = new google.maps.Marker({
      position: position,

      title: title,
      map: map,
      icon: {
        // house and keyhole
        path: `M248,20.5L0,226.5h59v245h368v-245h65L248,20.5z M304,400.5H188l24-110c-16-11.333-24-26.333-24-45c0-15.333,
        5.667-28.333,17-39s25-16,41-16s29.667,5.5,41,16.5s17,24.167,17,39.5c0,18-8.333,32.667-25,44L304,400.5z`,
        scale: 0.05,
        fillColor: fillColor,
        fillOpacity: 0.8,
        strokeColor: 'black',
        strokeWeight: 0.5
      },
      animation: google.maps.Animation.DROP
    })
    markers[i].addListener('click', function () {
      INFO_BUBBLE[i].open(map, markers[i])
    })
  }, dropDelay)
}

function animateBar (width, oldWidth, toDo) {
  width = Math.round(width / toDo * 100)
  oldWidth = maxWidth
  const id = setInterval(frame, 50)

  function frame () {
    if (maxWidth >= width) {
      clearInterval(id)
    } else {
      oldWidth++
      DOM.progressBar.style.width = oldWidth + '%'
    }
    maxWidth = oldWidth
  }
}

const updateMap = (i, address, count, result) => {
  animateBar(count++, i, POSTCODES.length)
  map.setCenter(result[0].geometry.location)
  BOUNDS.extend(result[0].geometry.location)
  address[i].position = result[0].geometry.location
  address[i].title = result[0].formatted_address
  address[i].fillColor = DAY_COLORS[i]
  address[i].content = BUBBLE_CONTENTS[i]
  return count
}

const getLatLng = (address, i, geocoder) => {
  geocoder.geocode({ address: address[i].postcode }, function (result, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      count = updateMap(i, address, count, result)
    } else {
      if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
        // Recursively calling getLatLng method for lost addresses
        setTimeout(function () {
          getLatLng(address, i, geocoder)
        }, 500)
      } else {
        window.alert('Geocoder failed because ' + status)
      }
    }
    if (count === POSTCODES.length) {
      BOUNDS.extend(latLangMK)
      map.fitBounds(BOUNDS)
      google.maps.event.addListenerOnce(map, 'idle', function () {
        drop()
      })
    }
  })
}
