const svg = d3.select("svg");
const width = +svg.style("width").slice(0, -2);  // Get width in pixels from CSS
const height = +svg.style("height").slice(0, -2);  // Get height in pixels from CSS

const projection = d3.geoMercator()
    .scale(width / 9.5)  // Adjust scale based on width
    .translate([width / 2, height / 2]);  // Center the map

const path = d3.geoPath().projection(projection);

const tooltip = d3.select(".tooltip");

// Adjusted color scale with more detailed thresholds
const colorScale = d3.scaleThreshold()
    .domain([1, 5000, 10000, 25000, 50000, 100000, 500000, 1000000])
    .range(["#f8e0ff", "#eaaeff", "#db7bff", "#cc48ee", "#be15dd", "#af00cc", "#9900b3", "#83009a", "#6d0081"]);

// Load and parse the data
Promise.all([
    d3.json("https://enjalot.github.io/wwsd/data/world/world-110m.geojson"),
    d3.csv("/dataset/filtered_deaths_2019.csv"),
]).then(function (data) {
    const [geojson, deathData] = data;

    let deathsByCountry = {};

    // Map CSV data to the country codes and round the values
    deathData.forEach(d => {
        deathsByCountry[d.Code] = {
            country: d.Entity,  // Ensure the country name is mapped correctly
            smoking: Math.round(+d.smoking),  // Round the values
            secondhand_smoke: Math.round(+d.secondhand_smoke),  // Round the values
            ambient_particulate_matter_pollution: Math.round(+d.ambient_particulate_matter_pollution)  // Round the values
        };
    });

    function updateMap(column) {
        svg.selectAll(".country")
            .data(geojson.features)
            .join("path")
            .attr("class", "country")
            .attr("d", path)
            .style("fill", d => {
                const deaths = deathsByCountry[d.id] && deathsByCountry[d.id][column];
                return deaths ? colorScale(deaths) : "#cccccc";  // Default to a light gray if no data
            })
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .style("stroke", "#FFFFFF")  // Set the stroke to white for visibility
                    .style("stroke-width", "2px");  // Increase the stroke width

                const deaths = deathsByCountry[d.id] && deathsByCountry[d.id][column] ? deathsByCountry[d.id][column] : "No data";
                const country = deathsByCountry[d.id] ? deathsByCountry[d.id].country : d.properties.name;
                tooltip
                    .html(`Country: ${country}<br>Deaths: ${deaths}`)
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY - 40}px`)
                    .style("display", "block")
                    .style("opacity", 1);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("stroke", "none")  // Remove the stroke on mouseout
                    .style("stroke-width", "0px");

                tooltip.style("opacity", 0).style("display", "none");
            });
    }

    function updateTable() {
        const tbody = d3.select("#dataTable tbody");
        tbody.selectAll("tr").remove();

        deathData.forEach(d => {
            const row = tbody.append("tr");
            row.append("td").text(d.Entity);  // Ensure the country name is displayed
            row.append("td").text(d.Code);
            row.append("td").text(Math.round(+d.smoking));  // Round the values
            row.append("td").text(Math.round(+d.secondhand_smoke));  // Round the values
            row.append("td").text(Math.round(+d.ambient_particulate_matter_pollution));  // Round the values
        });
    }

    function sortTable(columnIndex) {
        const table = d3.select("#dataTable");
        const rows = table.selectAll("tbody tr").nodes();
        const sortedRows = rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].innerText;
            const bValue = b.cells[columnIndex].innerText;
            return d3.ascending(aValue, bValue);
        });

        table.select("tbody").html("").selectAll("tr").data(sortedRows).enter().append(d => d);
    }

    d3.selectAll("#dataTable th").on("click", function () {
        const columnIndex = d3.select(this).node().cellIndex;
        sortTable(columnIndex);
    });

    document.querySelectorAll("#mainControls button").forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll("#mainControls button").forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (this.id === 'showMap') {
                document.getElementById('chartContainer').style.display = 'none';
                document.getElementById('dataTableContainer').style.display = 'none';
                document.getElementById('mapControls').style.display = 'block'; // Show map-specific controls
                d3.select("svg").style("display", "block");
            } else if (this.id === 'showChart') {
                document.getElementById('chartContainer').style.display = 'block';
                document.getElementById('dataTableContainer').style.display = 'none';
                document.getElementById('mapControls').style.display = 'none'; // Hide map-specific controls
                d3.select("svg").style("display", "none");
            } else if (this.id === 'showData') {
                document.getElementById('chartContainer').style.display = 'none';
                document.getElementById('dataTableContainer').style.display = 'block';
                document.getElementById('mapControls').style.display = 'none'; // Hide map-specific controls
                d3.select("svg").style("display", "none");
                updateTable(); // Update the table with the data
            }
        });
    });

    // Update map when radio buttons are selected
    document.querySelectorAll('#mapControls input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function () {
            updateMap(this.value);
        });
    });

    updateMap("smoking");  // Initialize with 'smoking' deaths

    // Add Legend
    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(50, 550)");

    legend.selectAll("rect")
        .data(colorScale.range().map(function (color) {
            const d = colorScale.invertExtent(color);
            if (d[0] == null) d[0] = colorScale.domain()[0];
            if (d[1] == null) d[1] = colorScale.domain()[colorScale.domain().length - 1];
            return d;
        }))
        .enter().append("rect")
        .attr("height", 8)
        .attr("x", d => colorScale(d[0]))
        .attr("width", d => colorScale(d[1]) - colorScale(d[0]))
        .attr("fill", d => colorScale(d[0]));

    // Add zoom functionality
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            svg.selectAll('path').attr('transform', event.transform);
        });

    svg.call(zoom);
});
