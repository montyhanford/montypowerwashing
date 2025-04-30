let map;

let polygon;
let polygonPath;

let points = [];
let markers = [];

let pathLine;

let service;
let serviceGroup;

let autocomplete;

let cost = 0;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.2654, lng: -76.7083 }, // Default center (San Francisco)
        zoom: 18,
        streetViewControl: false, // Remove the Street View button
        mapTypeControl: false,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        tilt: 0
    });

    
    document.getElementById('services').addEventListener('change', selectService);
    

    // Add a click event listener to the map
    map.addListener('click', (event) => {
        if (serviceGroup === 'Ground Surfaces') {
            // Add the clicked location to the polygon coordinates
            points.push(event.latLng);

            const marker = new google.maps.Marker({
                position: event.latLng,
                map:map,
            });
            markers.push(marker);

            // Update or create the polygon
            updatePolygon();

        } else if (serviceGroup === 'Vertical Surfaces') {

            // Store the marker and the point
            points.push(event.latLng);

            const marker = new google.maps.Marker({
                position: event.latLng,
                map:map,
            });
            markers.push(marker);

            // Update the path line
            updatePath();

            document.getElementById('calculate').disabled = false;
        }
    });

    document.getElementById('services-container').style.display = 'none';
    document.getElementById('calculate').style.display = 'none';
    document.getElementById('add-service').style.display = 'none';
    document.getElementById('add-service').disabled = true;
    document.getElementById('height').style.display = 'none';
}

function initAutocomplete() {

    autocomplete = new google.maps.places.Autocomplete(document.getElementById('auto'),
    {
        componentRestrictions: {'country': 'US'},
        fields: ['place_id', 'geometry', 'name']
        
    });

    autocomplete.addListener('place_changed', onPlaceChanged);
    
}

function onPlaceChanged() {
    var place = autocomplete.getPlace();

    if (!place.geometry) {
        document.getElementById('auto').placeholder = 'Enter your address';
    } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);

        document.getElementById('services-container').style.display = 'flex';
    }
}


function updatePolygon() {
    if (polygon) {
        polygon.setMap(null); // Remove the old polygon
    }

    polygon = new google.maps.Polygon({
        paths: points,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35
    });

    polygon.setMap(map);
}

function updatePath() {
    if (pathLine) {
        pathLine.setMap(null); // Remove the old path
    }

    // Create a polyline to show the path
    pathLine = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    pathLine.setMap(map);
}

let isValidHeight = false;

function calculateCost() {
    if (serviceGroup === 'Ground Surfaces') {
        if (points.length < 3) return;

        const polygonPath = new google.maps.MVCArray(points);
        const area = google.maps.geometry.spherical.computeArea(polygonPath);
        
        // Convert to square feet (1 square meter = 10.7639 square feet)
        const areaInSquareFeet = area * 10.7639;

        // Display the area
        if (service === 'concrete') {
            caclulateGroundSurfaceCost(.2, areaInSquareFeet);
        }
        else if (service === 'asphalt') {
            caclulateGroundSurfaceCost(.2, areaInSquareFeet);
        }
        else if (service === 'stone') {
            caclulateGroundSurfaceCost(.2, areaInSquareFeet);
        }
        else if (service === 'sidewalk') {
            caclulateGroundSurfaceCost(.25, areaInSquareFeet);
        }
        else if (service === 'pavers') {
            caclulateGroundSurfaceCost(.27, areaInSquareFeet);
        }
        else if (service === 'brick') {
            caclulateGroundSurfaceCost(.20, areaInSquareFeet);
        }
        else if (service === 'decking') {
            caclulateGroundSurfaceCost(.23, areaInSquareFeet);
        }
        else if (service === 'other-ground-surface') {
            caclulateGroundSurfaceCost(.23, areaInSquareFeet);
        }
        document.getElementById("calculate").disabled = true;
    } else if (serviceGroup === 'Vertical Surfaces') {
        if (points.length < 2) return;

        let totalDistance = 0;
    
        // Calculate the total distance by summing distances between consecutive points
        for (let i = 0; i < points.length - 1; i++) {
            totalDistance += google.maps.geometry.spherical.computeDistanceBetween(points[i], points[i + 1]);
        }

        // Convert to kilometers and miles
        const distanceInMiles = totalDistance * 0.000621371;
        const distanceInFeet = distanceInMiles * 5280;

        if (service === 'metal-fencing') {
            caclulateVerticalSurfaceCost(.40, distanceInFeet);
        }
        else if (service === 'wood-fencing') {
            caclulateVerticalSurfaceCost(.25, distanceInFeet);
        }
        else if (service === 'railings') {
            caclulateVerticalSurfaceCost(.42, distanceInFeet);
        }
        else if (service === 'vinyl-siding') {
            caclulateVerticalSurfaceCost(.25, distanceInFeet);
        }
        else if (service === 'stucco-siding') {
            caclulateVerticalSurfaceCost(.30, distanceInFeet);
        }
        else if (service === 'wood-siding') {
            caclulateVerticalSurfaceCost(.33, distanceInFeet);
        }
        else if (service === 'brick-wall') {
            caclulateVerticalSurfaceCost(.30, distanceInFeet);
        }
        else if (service === 'other-vertical-surface') {
            caclulateVerticalSurfaceCost(.30, distanceInFeet);
        }
        if (isValidHeight) {
                document.getElementById("calculate").disabled = true;
        }
    }
    isValidHeight = false;
}

function caclulateGroundSurfaceCost(pricePerSquareFoot, area) {
    cost += pricePerSquareFoot * area;
    document.getElementById('cost').innerText = `Total Cost: $ ${cost.toFixed(2)}`;
    document.getElementById('services').disabled = true;
    document.getElementById('add-service').disabled = false;
}

function caclulateVerticalSurfaceCost(pricePerSquareFoot, distance) {
    let selectElement = document.getElementById('height');
    let height = selectElement.value;

    if (height > 0) {
        cost += pricePerSquareFoot * distance * height;
        document.getElementById('cost').innerText = `Total Cost: $ ${cost.toFixed(2)}`;
        document.getElementById('services').disabled = true;
        document.getElementById('add-service').disabled = false;
        isValidHeight = true;
    }
    else {
        alert('Please enter a valid number for the height');
    }
}


function selectService(event) {
    let selectedValue = event.target.value;

    if (selectedValue === 'select-option') {
        document.getElementById('height').style.display = 'none';
        document.getElementById('calculate').style.display = 'none';
        document.getElementById('add-service').style.display = 'none';
        alert("Please select a service.");
        return;
    }
    
    serviceReset();

    let selectedOption = event.target.options[event.target.selectedIndex];
    
    // Find the parent <optgroup> element
    serviceGroup = selectedOption.parentElement.label;

    // Check if the selected value is 'select-option'
    if (serviceGroup === 'Vertical Surfaces') {
        document.getElementById('height').style.display = 'flex';
    } else {
        document.getElementById('height').style.display = 'none';
    }
    service = selectedValue;
    document.getElementById('calculate').style.display = 'flex';
    document.getElementById('add-service').style.display = 'flex';
    }

function serviceReset() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];

    // Remove the polygon from the map
    if (polygon) {
        polygon.setMap(null);
    }

    if (pathLine) {
        pathLine.setMap(null); // Remove the old path
    }

    // Clear the points array
    points = [];

    // Reset the area display
    document.getElementById('calculate').style.display = 'none';
    document.getElementById('add-service').style.display = 'none';
    document.getElementById('services').disabled = false;
    document.getElementById('height').style.display = 'none';
}

function fullReset() {
    addService();
    
    document.getElementById('cost').innerText = '';

    cost = 0;
}

function addService() {

    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];

    // Remove the polygon from the map
    if (polygon) {
        polygon.setMap(null);
    }

    if (pathLine) {
        pathLine.setMap(null); // Remove the old path
    }

    // Clear the points array
    points = [];

    // Reset the area display
    document.getElementById('calculate').style.display = 'none';
    document.getElementById('add-service').style.display = 'none';
    document.getElementById('services').disabled = false;

    service = 'select-option';

    document.getElementById('services').value = 'select-option';
    document.getElementById('calculate').disabled = false;
    document.getElementById('height').style.display = 'none';
}

window.onload = initMap;
