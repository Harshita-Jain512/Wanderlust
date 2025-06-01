mapboxgl.accessToken = "pk.eyJ1IjoiYXl1c2gxNTEwIiwiYSI6ImNtODVxbm84OTFhZG8ya3NhYjU1dzdzejgifQ.x_pVN04Ydq9FNJb6HzUQcA";
  const map = new mapboxgl.Map({
      container: 'map',
      // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
      style: 'mapbox://styles/mapbox/streets-v12',
      center: listing.geometry.coordinates,
      zoom: 8
  });

    // Create a default Marker and add it to the map.
    const marker1 = new mapboxgl.Marker({color :"red"})
        .setLngLat(listing.geometry.coordinates)
        .setPopup(
          new mapboxgl.Popup({offset:25}).setHTML(
            `<h5>${listing.location}</h5><p><i> <b> Exact Location will be Provided after booking </b></i> </p>`
          )
        )
        .addTo(map);
