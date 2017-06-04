/**
 * Created by thomas.loyan on 02/05/2017.
 */

    var maps = document.getElementById("maps");
    var map_way_info = document.getElementById("map_way_info");
    var map_departure = document.getElementById("departures");
    var map_arrival = document.getElementById("arrival");
    var map_search = document.getElementById("search");
    var map_travel_mode = document.getElementById("travel-mode");
    var map_checkpoint = document.getElementById("checkpoint");

    var map;
    var geocoder;
    var searchBoxDeparture;
    var searchBoxArrival;
    var directionDisplay;
    var markers = [];
    var waypoints = [];
    var count = 0;

    var initMap = function initMap() {

        var departuresPoint = new google.maps.LatLng(46.779231, 2.659431);
        geocoder = new google.maps.Geocoder();


        var options = {
            center: departuresPoint,
            zoom: 6,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDoubleClickZoom: false,
            draggable: true,
            scrollwheel: true,
            fullscreenControl: true
        };

        map = new google.maps.Map(maps, options);

        directionDisplay = new google.maps.DirectionsRenderer({
            map: map,
            panel: map_way_info,
            draggable: true
        });

        directionService = new google.maps.DirectionsService();
        placesService = new google.maps.places.PlacesService(map);
        searchBoxDeparture = new google.maps.places.SearchBox(map_departure);
        searchBoxArrival = new google.maps.places.SearchBox(map_arrival);

        searchBoxDeparture.addListener('places_changed', function () {
            var places = searchBoxDeparture.getPlaces();
            var placeSearch = function (places) {
                if (places.length === 0) {
                    return;
                }

                var cleanMarkers = function (markers) {
                    markers.forEach(function (m) {
                        m.setMap(null);
                    });
                    markers = [];
                };

                cleanMarkers(markers);
                //directionDisplay.set("directions", null);

                var bounds = new google.maps.LatLngBounds();
                places.forEach(function (p) {
                    var icon = {
                        url: p.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    };

                    markers.push(new google.maps.Marker({
                        map: map,
                        icon: icon,
                        title: p.name,
                        position: p.geometry.location
                    }));

                    if (p.geometry.viewport) {
                        bounds.union(p.geometry.viewport);
                    } else {
                        bounds.extend(p.geometry.location);
                    }
                });
                map.fitBounds(bounds);
            };
            placeSearch(places);
        });

        var searchByString = function (string) {
            var cleanMarkers = function (markers) {
                markers.forEach(function (marker) {
                    marker.setMap(null);
                });
                markers = [];
            };
            cleanMarkers(markers);

            placesService.textSearch(function (results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    cleanMarkers(markers);

                    var coords = results[0].geometry.location;
                    map.setCenter(coords);

                    var marker = new google.maps.Marker({
                        position: coords,
                        map: map,
                        animation: google.maps.Animation.DROP
                    });
                    markers.push(marker);

                    departInput.value = results[0].formatted_address;
                }
            });
        };

        var letsGo = function () {
            var begin = map_departure.value;
            var end = map_arrival.value;
            var mode;
            var push = 0;
            var waypoints = [];

            console.log(begin);
            console.log(end);

            var cleanMarkers = function (markers) {
                markers.forEach(function (marker) {
                    marker.setMap(null);
                });
                markers = [];
            };
            cleanMarkers(markers);

            switch (map_travel_mode.value) {
                case "bicycling":
                    mode = google.maps.TravelMode.BICYCLING;
                    break;
                case "transit":
                    mode = google.maps.TravelMode.TRANSIT;
                    break;
                case "walking":
                    mode = google.maps.TravelMode.WALKING;
                    break;
                default:
                    mode = google.maps.TravelMode.DRIVING;
                    break;
            }

            if (begin !== "" && end !== "") {
                request = {
                    origin: begin,
                    destination: end,
                    travelMode: mode
                }

                directionService.route(request, function (result, status) {
                    if (status === google.maps.DirectionsStatus.OK) {
                        var findWaypoints = function (km) {
                            var coords = [];
                            var count = 0;
                            var string = [];
                            for (var z = 0; z < map_checkpoint.length; z++) {
                                if (map_checkpoint.options[z].selected) {
                                    string.push(map_checkpoint.options[z].value);
                                }
                            }
                            var len = km.length / 23;

                            for (var i = 0; Math.floor(i * len) < km.length-1; i++) {
                                coords.push({lat: km[Math.floor(i * len)].lat(), lng: km[Math.floor(i * len)].lng()});
                            }

                            var i = 0;
                            var a = setInterval(callback = function () {
                                if(i < coords.length) {
                                    request = {
                                        location: coords[i],
                                        radius: result.routes[0].legs[0].distance.value * 0.2,
                                        type: string[Math.floor(Math.random()*(string.length))]
                                    };

                                    placesService.nearbySearch(request, function (resulta) {
                                        if (resulta !== null) {
                                            var flag = 0;
                                            var flog = 0;
                                            var k;

                                            for (var j = 0; j < resulta.length && resulta.length !== 0; j++) {
                                                flag = 0;
                                                flog = 0;
                                                k = -1;
                                                var g = 0;
                                                while(g < waypoints.length) {
                                                    if (waypoints[g].location.lat() === resulta[j].geometry.location.lat()
                                                        && waypoints[g].location.lng() === resulta[j].geometry.location.lng()) {
                                                        flag = 1;
                                                    } else if (k === -1 && flog !== 1) {
                                                        k = j;
                                                        flog = 1;
                                                    }
                                                    g++;
                                                }

                                                if ((flag === 0 && k !== -1) || waypoints.length === 0) {
                                                    if (k === -1) {
                                                        k = 0;
                                                    }
                                                    waypoints.push({
                                                        location: resulta[k].geometry.location,
                                                        stopover: true
                                                    });
                                                    j = resulta.length;
                                                    i++;
                                                }
                                            }
                                        } else {
                                            i++;
                                        }
                                    });
                                } else {
                                    clearInterval(a);
                                }
                            }, 300);
                            setTimeout(function () {

                            request = {
                                origin: begin,
                                destination: end,
                                travelMode: mode,
                                waypoints: waypoints,
                                optimizeWaypoints: true
                            };

                            directionService.route(request, function (result, status) {
                                if (status === google.maps.DirectionsStatus.OK) {
                                    directionDisplay.setDirections(result);
                                    try
                                    {
                                        localStorage.setItem("MyMapsRoute", JSON.stringify(result));
                                        return true;
                                    }
                                    catch (error)
                                    {
                                        return false;
                                    }
                                }
                            });
                            clearTimeout();
                            }, 10000);
                        };
                        findWaypoints(result.routes[0].overview_path);
                    }
                });
            }
        };

        search.addEventListener("click", function () {
            if (map_departure.value !== "") {
                if (map_arrival.value === "") {
                    searchByString(map_departure.value);
                } else {
                    letsGo();
                }
            }
        });

        var geolocalisation = function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    map.setCenter(pos);

                    var marker = new google.maps.Marker({
                        position: pos,
                        map: map,
                        animation: google.maps.Animation.DROP
                    });
                    markers.push(marker);
                    var reverseGeocode = function (pos) {
                        geocoder.geocode({'location': pos}, function (results, status) {
                            if (status === google.maps.GeocoderStatus.OK) {
                                if (results[1]) {
                                    map.setZoom(13);
                                    map_departure.value = results[0].formatted_address;
                                }
                            }
                        });
                    };
                    reverseGeocode(pos);
                });
            }
        };

        geolocalisation();

        google.maps.event.addListener(map, 'click', function( event ) {
            var lat = event.latLng.lat();
            var lng = event.latLng.lng();
            var pos = {
                lat: lat,
                lng: lng
            };

            if(map_departure.value === "") {
                console.log(1);
                map_departure.value = lat + ", " + lng;
                var marker = new google.maps.Marker({
                    position: pos,
                    map: map,
                    animation: google.maps.Animation.DROP
                });
                map.setCenter(pos);
                markers.push(marker);
            } else if (map_arrival.value === "") {
                console.log(2);
                map_arrival.value = lat + ", " + lng;
                var marker = new google.maps.Marker({
                    position: pos,
                    map: map,
                    animation: google.maps.Animation.DROP
                });
                map.setCenter(pos);
                markers.push(marker);
            }
        });

        if (localStorage.getItem("MyMapsRoute") !== null) {
            directionDisplay.set("directions", JSON.parse(localStorage.getItem("MyMapsRoute")));
        }

    };