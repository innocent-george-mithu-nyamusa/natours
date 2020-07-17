/* eslint-disable*/

export const displayMap = locations => {
  //NOTE: Place a map object here that you obtain from the mapbox setup and The token
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaW5ub2NlbnQtZ2VvcmdlLW1pdGh1LW55YW11c2EiLCJhIjoiY2tiaTBwYjRoMGFucDJ6cnBvNWhmMWN5dyJ9.1vNTdbLQ3H_vL-sjWZNRzA';
  const map = new mapboxgl.Map({
    container: 'map',
    style:
      'mapbox://styles/innocent-george-mithu-nyamusa/ckckke3r529si1jo549k51662',
    ScrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.array.forEach(loc => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordiates)
      .addTo('map');

    // Create a popup with an offset property to allow
    //the content
    new mapboxgl.Popup({
      offset: 40
    })
      .setLngLat(loc.coordiates)
      .setHTML(`<p>Day ${loc.day}: ${loc.descriptions}</p>`)
      .addTo('map');

    //extend map bounds to include current location
    bounds.extend(loc.coordiates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
