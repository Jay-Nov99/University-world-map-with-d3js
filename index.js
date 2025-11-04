//importing select, json, geoPath, geoEquirectangular functions from d3
import { select, json, geoPath, geoEquirectangular } from 'd3';
//importing feature method from TopoJSON that creates the GeoJSON objects
import { feature } from 'topojson';

//defining select() where it selects only one DOM element by matching the given CSS selector
const svg = select('svg');

//selecting 'geoEquirectangular()' function as a geo-projection to view the world map 
const projection = geoEquirectangular();
const pathGenerator = geoPath().projection(projection);

//adding a path element to the existing SVG, defining class as 'sphere'
svg.append('path')
    .attr('class', 'sphere')
    .attr('d', pathGenerator({type: 'Sphere'}));

//.json file which contains the data required to visualise world map
json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  .then(data => {
    const countries = feature(data, data.objects.countries);
//'selectAll()' function is used to select all the element that matches the specified selector string
    svg.selectAll('path').data(countries.features)
//enter() creates the initial join of data to elements
      .enter().append('path')
        .attr('class', 'country')
        .attr('d', pathGenerator);
  });