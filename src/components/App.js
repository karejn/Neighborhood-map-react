import React, { Component } from "react";
import LocationList from "./LocationList";

class App extends Component {
  /**
   * Constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      alllocations: require("./places.json"), // Get the locations from the JSON file
      map: "",
      infowindow: "",
      prevmarker: ""
    };

    // retain object instance when used in the function
    this.initMap = this.initMap.bind(this);
    this.openInfoWindow = this.openInfoWindow.bind(this);
    this.closeInfoWindow = this.closeInfoWindow.bind(this);
  }

  componentDidMount() {
    window.initMap = this.initMap;
    loadMapJS(
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyAnHAIJyBMjXUdOqeoikTBOk0oV7Z2xl8A&callback=initMap"
    );
  }

  /**
   * Initialise the map once the google map script is loaded
   */
  initMap() {
    var self = this;

    var mapview = document.getElementById("map");
    mapview.style.height = window.innerHeight + "px";
    var map = new window.google.maps.Map(mapview, {
      center: { lat: 46.6237467, lng: 14.3062055 },
      zoom: 16,
      mapTypeControl: false
    });

    var InfoWindow = new window.google.maps.InfoWindow({});

    window.google.maps.event.addListener(InfoWindow, "closeclick", function() {
      self.closeInfoWindow();
    });

    this.setState({
      map: map,
      infowindow: InfoWindow
    });

    window.google.maps.event.addDomListener(window, "resize", function() {
      var center = map.getCenter();
      window.google.maps.event.trigger(map, "resize");
      self.state.map.setCenter(center);
    });

    window.google.maps.event.addListener(map, "click", function() {
      self.closeInfoWindow();
    });

    var alllocations = [];
    this.state.alllocations.forEach(function(location) {
      var longname = location.name + " - " + location.type;
      var marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(
          location.latitude,
          location.longitude
        ),
        animation: window.google.maps.Animation.DROP,
        map: map
      });

      marker.addListener("click", function() {
        self.openInfoWindow(marker);
      });

      location.longname = longname;
      location.marker = marker;
      location.display = true;
      alllocations.push(location);
    });
    this.setState({
      alllocations: alllocations
    });
  }

  /**
   * Open the infowindow for the marker
   */
  openInfoWindow(marker) {
    this.closeInfoWindow();
    this.state.infowindow.open(this.state.map, marker);
    marker.setAnimation(window.google.maps.Animation.BOUNCE);
    this.setState({
      prevmarker: marker
    });
    this.state.infowindow.setContent("Loading Data...");
    this.state.map.setCenter(marker.getPosition());
    this.state.map.panBy(0, -200);
    this.getMarkerInfo(marker);
  }

  /**
   * Retrive the location data from the foursquare api
   */
  getMarkerInfo(marker) {
    var self = this;

    // Add the api keys for foursquare
    var clientId = "VBJUG24FKLTW34N2ICV4WWEH2U0SQ2EVOQSN5RKAJ33MBRAA";
    var clientSecret = "GFFMIOVJSPIT330OMJXPPCTAJM305BOOK0UXSTVKU3M2AAPT";

    // Build the api endpoint
    var url =
      "https://api.foursquare.com/v2/venues/search?client_id=" +
      clientId +
      "&client_secret=" +
      clientSecret +
      "&v=20180323&ll=" +
      marker.getPosition().lat() +
      "," +
      marker.getPosition().lng() +
      "&limit=1";
    fetch(url)
      .then(function(response) {
        if (response.status !== 200) {
          self.state.infowindow.setContent("Sorry data can't be loaded");
          return;
        }

        // Get the text in the response
        response.json().then(function(data) {
          console.log(data);

          var location_data = data.response.venues[0];
          var place = `<h3>${location_data.name}</h3>`;
          var street = `<p>${location_data.location.formattedAddress[0]}</p>`;
          var contact = "";
          if (location_data.contact.phone)
            contact = `<p><small>${location_data.contact.phone}</small></p>`;
          var checkins =
            "<b>Number of checkins: </b>" +
            location_data.stats.checkinsCount +
            "<br>";
          var readMore =
            '<a href="https://foursquare.com/v/' +
            location_data.id +
            '" target="_blank">Details on <b>Foursquare</b></a>';
          self.state.infowindow.setContent(
            place + street + contact + checkins + readMore
          );
        });
      })
      .catch(function(err) {
        self.state.infowindow.setContent("Sorry data can't be loaded");
      });
  }

  /**
   * Close the info window previously opened
   *
   * @memberof App
   */
  closeInfoWindow() {
    if (this.state.prevmarker) {
      this.state.prevmarker.setAnimation(null);
    }
    this.setState({
      prevmarker: ""
    });
    this.state.infowindow.close();
  }

  /**
   * Render for react
   */
  render() {
    return (
      <div>
        <LocationList
          key="100"
          alllocations={this.state.alllocations}
          openInfoWindow={this.openInfoWindow}
          closeInfoWindow={this.closeInfoWindow}
        />
        <div id="map" />
      </div>
    );
  }
}

export default App;

/**
 * Load the google maps
 * @param {src} url of the google maps script
 */
function loadMapJS(src) {
  var ref = window.document.getElementsByTagName("script")[0];
  var script = window.document.createElement("script");
  script.src = src;
  script.async = true;
  script.onerror = function() {
    document.write("Google Maps can't be loaded");
  };
  ref.parentNode.insertBefore(script, ref);
}
