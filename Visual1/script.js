// Author: Nhat Truong Pham - 103140116

// Get the container dimensions
const container = document.getElementById("map-container");
const width = container.clientWidth;
const height = container.clientHeight;
const padding = 20;

// Set up the projection and path
const projection = d3.geoNaturalEarth1().scale((width - 2 * padding) / (1.5 * Math.PI)).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// Select the SVG container and append a group
const svg = d3.select("#map-container").select("svg");
const group = svg.append("g");

// Set up zoom behavior
const zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', (event) => {
    group.attr('transform', event.transform);
});
svg.call(zoom);

// Set up color scale
let colorScale = d3.scaleThreshold().domain([0, 25, 50, 100, 250, 500]).range(d3.schemeBlues[6]);

// Load GeoJSON and CSV data
Promise.all([
    d3.json('/dataset/custom.geo.json'),
    d3.csv('/dataset/HEALTH_LVNG_21052024065903702.csv')
]).then(([geoData, csvData]) => {
    // Populate variable selector with unique variables from CSV data
    const variables = Array.from(new Set(csvData.map(d => d.Variable)));
    const variableSelect = d3.select('#variable-select');
    variableSelect.selectAll('option')
        .data(variables)
        .enter().append('option')
        .attr('value', d => d)
        .text(d => d);
    const measureSelect = d3.select('#measure-select');
    const yearSelect = d3.select('#year-select');
    const regionSelect = d3.select('#region-select');

    // Function: Capitalize the first character of each word in a string
    const capitalizeWords = (str) => {
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Function: Update titles based on selected values
    function updateTitles() {
        const selectedVariable = variableSelect.property('value');
        const selectedMeasure = measureSelect.property('value');
        const selectedYear = yearSelect.property('value');
        const selectedRegion = regionSelect.property('value');

        const mainTitle = `${capitalizeWords(selectedRegion)}: ${selectedVariable} in ${selectedYear}`;
        const subTitle = `Measure: ${selectedMeasure}`;

        document.getElementById('main-title').textContent = mainTitle;
        document.getElementById('sub-title').textContent = subTitle;
    }

    // Function: Update measures and years based on selected variable
    function updateMeasuresAndYears() {
        const selectedVariable = variableSelect.property('value');
        const filteredData = csvData.filter(d => d.Variable === selectedVariable);

        const measures = Array.from(new Set(filteredData.map(d => d.Measure)));
        measureSelect.selectAll('option').remove();
        measureSelect.selectAll('option')
            .data(measures)
            .enter().append('option')
            .attr('value', d => d)
            .text(d => d);

        const years = Array.from(new Set(filteredData.map(d => d.Year)));
        yearSelect.selectAll('option').remove();
        yearSelect.selectAll('option')
            .data(years)
            .enter().append('option')
            .attr('value', d => d)
            .text(d => d);

        updateTitles();
        updateMap();
    }

    // Function: Update the map based on selected values
    function updateMap() {
        const selectedVariable = variableSelect.property('value');
        const selectedMeasure = measureSelect.property('value');
        const selectedYear = +yearSelect.property('value');

        // Filter data based on selected variable, measure, and year
        const filteredData = csvData.filter(d => d.Variable === selectedVariable && d.Measure === selectedMeasure && +d.Year === selectedYear);
        // Create a new Map to store country-value pairs
        const dataMap = new Map();
        filteredData.forEach(d => dataMap.set(d.Country, +d.Value));

        // Extract numerical values from the filtered data, excluding any NaN values
        const values = filteredData.map(d => +d.Value).filter(d => !isNaN(d));
        // Update the color scale if there are valid values in the dataset
        if (values.length > 0) {
            const min = 0;
            const max = Math.max(...values);
            const step = Math.ceil((max - min) / 5);
            const domain = d3.range(min, max + step, step);
            colorScale = d3.scaleThreshold().domain(domain).range(d3.schemeBlues[domain.length]);
        }
        // Bind geoData features to path elements, joining data to elements
        group.selectAll('path')
            .data(geoData.features)
            .join('path')
            // Assign class based on whether the data for the country is available
            .attr('class', d => dataMap.get(d.properties.name) == null ? 'no-data' : 'country')
            .attr('d', path)
            // Fill color
            .attr('fill', d => {
                const value = dataMap.get(d.properties.name);
                return value != null ? colorScale(value) : 'url(#diagonalHatch)';
            })
            .attr('stroke', '#000')
            // Add event listeners for tooltip
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).classed('highlight', true);
                showTooltip(event, d, selectedVariable, selectedMeasure);
            })
            .on('mouseout', (event, d) => {
                d3.select(event.currentTarget).classed('highlight', false);
                hideTooltip();
            });

        updateColorBar(dataMap);
        highlightRegion(regionSelect.property('value'));
    }

    // Define diagonal hatch pattern for no data
    svg.append("defs").append("pattern")
        .attr("id", "diagonalHatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 4)
        .attr("height", 4)
        .append("path")
        .attr("d", "M0,0 L4,4")
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

    // Event listeners for selectors
    regionSelect.on('change', () => {
        updateTitles();
        highlightRegion(regionSelect.property('value'));
    });
    variableSelect.on('change', () => {
        updateMeasuresAndYears();
        updateTitles();
    });
    measureSelect.on('change', () => {
        updateTitles();
        updateMap();
    });
    yearSelect.on('change', () => {
        updateTitles();
        updateMap();
    });

    // Function: Highlight selected region
    function highlightRegion(region) {
        // Retrieve the currently selected variable, measure, and year from the dropdowns
        const selectedVariable = variableSelect.property('value');
        const selectedMeasure = measureSelect.property('value');
        const selectedYear = +yearSelect.property('value');

        // Filter the CSV data based on the selected variable, measure, and year, and create a map of country-value pairs
        const filteredData = csvData.filter(d => d.Variable === selectedVariable && d.Measure === selectedMeasure && +d.Year === selectedYear);
        const dataMap = new Map();
        filteredData.forEach(d => dataMap.set(d.Country, +d.Value));

        // If the selected region is 'world', reset the opacity, fill color of all paths, and apply zoom to fit the entire world map
        if (region === 'world') {
            group.selectAll('path')
                .attr('opacity', 1)
                .attr('fill', d => {
                    const value = dataMap.get(d.properties.name);
                    return value != null ? colorScale(value) : 'url(#diagonalHatch)';
                });

            const bounds = path.bounds({ type: "FeatureCollection", features: geoData.features });
            // Calculate Width and Height of the Bounding Box
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            // Calculate the Center of the Bounding Box
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;
            // Calculate the Scale and Translation for the zoom
            const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];

            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
            return;
        }

        // If a specific region is selected, update the opacity, fill color of the paths to highlight the region, and apply zoom to fit the selected region
        group.selectAll('path')
            .attr('opacity', d => d.properties.continent.toLowerCase() === region ? 1 : 0.1)
            .attr('fill', d => d.properties.continent.toLowerCase() === region ? (dataMap.get(d.properties.name) != null ? colorScale(dataMap.get(d.properties.name)) : 'url(#diagonalHatch)') : 'none');

        const bounds = path.bounds({ type: "FeatureCollection", features: geoData.features.filter(d => d.properties.continent.toLowerCase() === region) });
        const dx = bounds[1][0] - bounds[0][0];
        const dy = bounds[1][1] - bounds[0][1];
        const x = (bounds[0][0] + bounds[1][0]) / 2;
        const y = (bounds[0][1] + bounds[1][1]) / 2;
        let scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
        let translate = [width / 2 - scale * x, height / 2 - scale * y];

        // Adjust the translation for Oceania to center
        if (region === 'oceania') {
            translate[0] -= width / 2.5;
        }

        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
    }

    // Tooltip setup
    const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    // Function: Show tooltip on hover
    function showTooltip(event, d, selectedVariable, selectedMeasure) {
        // Get country name and selected year
        const countryName = d.properties.name;
        const selectedYear = +yearSelect.property('value');
        // Filter the CSV data for the selected variable, measure, and country
        const filteredData = csvData.filter(data => data.Variable === selectedVariable && data.Measure === selectedMeasure && data.Country === countryName);

        // Find the data for the selected year & get the value for selected year; or 'No Data' if not available.
        const currentData = filteredData.find(data => +data.Year === selectedYear);
        const currentValue = currentData ? currentData.Value : 'No data';

        if (currentData) {
            // Set up dimensions and margin for the tooltip chart
            const margin = { top: 20, right: 20, bottom: 30, left: 20 };
            const tooltipWidth = 300;
            const tooltipHeight = 200;
            // Set up scale for x-axis and y-axis
            const xScale = d3.scaleLinear().domain(d3.extent(filteredData, data => +data.Year)).range([margin.left, tooltipWidth - margin.right]);
            const yScale = d3.scaleLinear().domain([0, d3.max(filteredData, data => +data.Value)]).range([tooltipHeight - margin.bottom, margin.top]);

            // Define the line generator
            const line = d3.line()
                .x(data => xScale(+data.Year))
                .y(data => yScale(+data.Value));

            // Find the maximum value and year for the selected country
            const maxValue = d3.max(filteredData, data => +data.Value);
            const maxYear = filteredData.find(data => +data.Value === maxValue).Year;

            // Create line chart SVG
            const lineChartSVG = d3.create("svg")
                .attr("width", tooltipWidth)
                .attr("height", tooltipHeight);

            // Append line path to the SVG
            lineChartSVG.append("path")
                .datum(filteredData)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2);

            // Append circles to the SVG. Circle size is 5 for the selected year, 0 otherwise
            lineChartSVG.selectAll("circle")
                .data(filteredData)
                .enter().append("circle")
                .attr("cx", data => xScale(+data.Year))
                .attr("cy", data => yScale(+data.Value))
                .attr("r", data => +data.Year === selectedYear ? 5 : 0)
                .attr("fill", "steelblue");

            const yearFormat = d3.format("");

            // Append the x-axis to the SVG
            lineChartSVG.append("g")
                .attr("transform", `translate(0,${tooltipHeight - margin.bottom})`)
                .call(d3.axisBottom(xScale).tickFormat(yearFormat).tickValues([d3.min(filteredData, data => +data.Year), d3.max(filteredData, data => +data.Year)]));

            // Append a horizontal line for the maximum value
            lineChartSVG.append("line")
                .attr("x1", margin.left)
                .attr("x2", tooltipWidth - margin.right)
                .attr("y1", yScale(maxValue))
                .attr("y2", yScale(maxValue))
                .attr("stroke", "grey")
                .attr("stroke-dasharray", "1,1");

            // Append text for the maximum value
            lineChartSVG.append("text")
                .attr("x", tooltipWidth)
                .attr("y", yScale(maxValue) - 5)
                .attr("text-anchor", "end")
                .attr("fill", "grey")
                .text(`${maxValue} (${maxYear})`);

            // Append a vertical line for the selected year
            lineChartSVG.append("line")
                .attr("x1", xScale(selectedYear))
                .attr("x2", xScale(selectedYear))
                .attr("y1", yScale(currentValue))
                .attr("y2", tooltipHeight - margin.bottom)
                .attr("stroke", "grey")
                .attr("stroke-dasharray", "2,2");

            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
                <div class="tooltip-content">
                    <strong class="tooltip-country">${countryName}</strong>
                    <span class="tooltip-year">${selectedYear}</span>
                    <br>
                    <span class="tooltip-value">${currentValue} </span>${selectedMeasure}
                </div>
            `).style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");

            tooltip.append(() => lineChartSVG.node());

            // Adjust the tooltip position if it overflows the container boundaries
            const tooltipNode = tooltip.node();
            const tooltipRect = tooltipNode.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            if (tooltipRect.right > containerRect.right) {
                tooltip.style("left", (event.pageX - tooltipRect.width - 15) + "px");
            }
            if (tooltipRect.bottom > containerRect.bottom) {
                tooltip.style("top", (event.pageY - tooltipRect.height - 28) + "px");
            }
        } else {
            // Tooltip for No Data country
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
                <div class="tooltip-content">
                    <strong class="tooltip-country">${countryName}</strong>
                    <span class="tooltip-year">${selectedYear}</span>
                    ${selectedMeasure}<br>
                    <span class="tooltip-value">No data</span>
                </div>
            `).style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");

            const tooltipNode = tooltip.node();
            const tooltipRect = tooltipNode.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            if (tooltipRect.right > containerRect.right) {
                tooltip.style("left", (event.pageX - tooltipRect.width - 15) + "px");
            }
            if (tooltipRect.bottom > containerRect.bottom) {
                tooltip.style("top", (event.pageY - tooltipRect.height - 28) + "px");
            }
        }
    }

    // Function: Hide tooltip
    function hideTooltip() {
        tooltip.transition().duration(500).style("opacity", 0);
    }

    // Function: Update color bar based on selected data
    function updateColorBar(dataMap) {
        const colorBarWidth = 400;
        const colorBarHeight = 30;
        const colorBarMargin = { top: 10, right: 10, bottom: 30, left: 10 };
        const segmentWidth = colorBarWidth / (colorScale.range().length + 1); // +1 for the "No data" segment

        // Select the SVG element for the color bar and set its dimensions
        const colorBarGroup = d3.select("#color-bar-group")
            .attr("width", colorBarWidth + colorBarMargin.left + colorBarMargin.right)
            .attr("height", colorBarHeight + colorBarMargin.top + colorBarMargin.bottom);

        // Remove any existing elements within the color bar group
        colorBarGroup.selectAll("*").remove();

        // Append a new group element to the color bar group with the specified margin
        const colorBar = colorBarGroup.append("g")
            .attr("transform", `translate(${colorBarMargin.left}, ${colorBarMargin.top})`);

        // Append a rectangle for the "No data" segment and set its fill to a diagonal hatch pattern
        colorBar.append("rect")
            .attr("x", -10)
            .attr("y", 0)
            .attr("width", segmentWidth)
            .attr("height", colorBarHeight)
            .style("fill", "url(#diagonalHatch)")
            .on("mouseover", function (event) {
                d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
                const selectedRegion = regionSelect.property('value').toLowerCase();
                group.selectAll("path")
                    .attr("opacity", pathData => {
                        if (selectedRegion === 'world') {
                            return dataMap.get(pathData.properties.name) == null ? 1 : 0.1;
                        } else {
                            return pathData.properties.continent.toLowerCase() === selectedRegion && dataMap.get(pathData.properties.name) == null ? 1 : 0.1;
                        }
                    });
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", null).attr("stroke-width", null);
                highlightRegion(regionSelect.property('value'));
            });
        // Append text to label the "No data" segment
        colorBar.append("text")
            .attr("x", segmentWidth / 4)
            .attr("y", colorBarHeight + 15)
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .text("No data");

        // Bind data to color segments and append groups for each color bar segment
        const legend = colorBar.selectAll(".color-bar")
            .data(colorScale.range().map(d => {
                const range = colorScale.invertExtent(d);
                if (!range[0]) range[0] = colorScale.domain()[0];
                if (!range[1]) range[1] = colorScale.domain()[colorScale.domain().length - 1];
                return range;
            }))
            .enter().append("g")
            .attr("class", "color-bar");
        // Append rectangles for each color segment and set their fill color
        legend.append("rect")
            .attr("x", (d, i) => (i + 1.5) * segmentWidth)
            .attr("y", 0)
            .attr("width", segmentWidth)
            .attr("height", colorBarHeight)
            .style("fill", (d, i) => colorScale.range()[i])
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
                const selectedRegion = regionSelect.property('value').toLowerCase();
                group.selectAll("path")
                    .attr("opacity", pathData => {
                        const value = dataMap.get(pathData.properties.name);
                        if (selectedRegion === 'world') {
                            return value >= d[0] && value < d[1] ? 1 : 0.1;
                        } else {
                            return pathData.properties.continent.toLowerCase() === selectedRegion && value >= d[0] && value < d[1] ? 1 : 0.1;
                        }
                    });
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", null).attr("stroke-width", null);
                highlightRegion(regionSelect.property('value'));
            });

        // Create an array of tick values for the color bar
        const ticks = ["All Data"].concat(colorScale.domain());
        // Append text labels for each tick value
        colorBar.selectAll(".tick")
            .data(ticks)
            .enter().append("text")
            .attr("class", "tick")
            .attr("x", (d, i) => (i + 1.5) * segmentWidth)
            .attr("y", colorBarHeight + 15)
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .text(d => d);
    }

    // Add a click event listener to the 'see-trend' button
    document.getElementById('see-trend').addEventListener('click', function () {
        const yearSelect = document.getElementById('year-select');
        const options = Array.from(yearSelect.options).map(option => +option.value);
        // Reset to the start-year each time the button is clicked
        let currentYearIndex = 0;

        // Increment the year and update the visualisation
        function incrementYear() {
            if (currentYearIndex < options.length - 1) {
                yearSelect.value = options[currentYearIndex];
                updateTitles();
                updateMap();
                currentYearIndex++;
            } else {
                yearSelect.value = options[currentYearIndex];
                updateTitles();
                updateMap();
                // Stop the interval when the end-year is reached
                clearInterval(window.yearInterval);
            }
        }
        // Increase year every 0.1 seconds
        window.yearInterval = setInterval(incrementYear, 100);
    });

    // Initialize map with default values
    updateMeasuresAndYears();
}).catch(error => {
    console.error('Error loading the data: ', error);
});
