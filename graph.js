function drawBarChart(graph, index) {
    if (!$('#meta-info').hasClass('invisible')) {
        $('#meta-info').addClass('invisible');
    }
    if (index && graph[index].hasOwnProperty('scores')) {
        if (graph[index]['id'].substring('Abnormal') != -1) {
            $('#reasoning-text').text('Different Devices Behavior');
        } else {
            $('#reasoning-text').text('Normal User');
        }
        $('#score-text').text((1 - graph[index]['abnormalScore'] / graph[index]['scores'].length).toFixed(2));
        $('#meta-info').removeClass('invisible');
        var width = +d3.select('#header').style('width').slice(0, -2);
        var svg = d3.select('#bar-chart-canvas')
        svg.selectAll('*').remove();
        svg.attr('width', width * 0.75)
            .attr('height', 300)
        var margin = {top: 10, right: 20, bottom: 30, left: 50};
        var width = +svg.attr("width") - margin.left - margin.right;
        var height = +svg.attr("height") - margin.top - margin.bottom;
        var tooltip = d3.select("body").append("div").attr("class", "toolTip");
        var x = d3.scaleLinear().range([0, width]);
        var y = d3.scaleBand().range([height, 0]);
        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var data = graph[index]['scores'];
        x.domain([0, d3.max(data, function(d) { return d.score; })]);
        y.domain(data.map(function(d) { return d.id; })).padding(0.1);
        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5).tickFormat(function(d) { return parseFloat(d); }).tickSizeInner([-height]));

        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));

        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("y", function(d) { return y(d.id); })
            .attr("width", function(d) { return Math.max(x(d.score), 5); })
            .on("mousemove", function(d){
                tooltip
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .html((d.id) + ': ' + (d.score));
            })
            .on("mouseout", function(d){ tooltip.style("display", "none");})
            .on('click', function(d) {
                var nodes = d.nodes;
                d3.selectAll('.node circle')
                    .attr('fill', function(dd) {
                        if (!this.highlighted) {
                            this.originalColor = d3.select(this).attr('fill');
                        }
                        if (nodes.includes(dd.originalID)) {
                            if (this.highlighted) {
                                this.highlighted = false;
                                return this.originalColor;
                            } else {
                                this.highlighted = true;
                                return '#6F257F';
                            }
                        }
                        return this.originalColor;
                    })
            });
    }
}
function drawGraph(graph, config, svg, color) {
    if (config.hasOwnProperty('width')) {
        var forceX = d3.forceX(config.width / 2).strength(0.08)
        var forceY = d3.forceY(config.height / 2).strength(0.08)

        var simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(function(d) { return d.id; }))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('x', forceX)
            .force('y',  forceY);
    } else {
        var rowIndex = Math.floor(config.index / config.cntPerRow);
        var columnIndex = config.index % config.cntPerRow;
        var y0 = rowIndex * config.cellWidth;
        var x0 = columnIndex * config.cellWidth;

        svg.append('rect')
            .attr('x', x0)
            .attr('y', y0)
            .attr('width', config.cellWidth)
            .attr('height', config.cellWidth)
            .attr('fill', 'none')
            .attr('stroke', '#cccccc')
            .attr('stroke-width', '1px');

        var simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(function(d) { return d.id; }))
            .force('charge', d3.forceManyBody().strength(-3000))
            .force('center', d3.forceCenter(x0 + config.cellWidth / 2, y0 + config.cellWidth / 2));
    }

    var link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graph.links)
        .enter().append('line')
        .attr('stroke', '#999999')
        .attr('stroke-width', '3px')
        .attr('stroke-opacity', function(d) {
            return Math.max(0.5, d.weight);
        });

    var node = svg.append('g')
        .selectAll('.node')
        .data(graph.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
        
    node.append('circle')
        .attr('r', 10)
        .attr('fill', function(d) { return color(d.name); })

    node.append('text')
        .attr('dx', -18)
        .attr('dy', 25)
        .text(function(d) { return d.id.substring(0, 5) });

    simulation
        .nodes(graph.nodes)
        .on('tick', ticked);

    simulation.force('link')
        .links(graph.links);

    function ticked() {
        link
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

(function(){
    var wrapperWidth = +d3.select('#header').style('width').slice(0, -2);
    var graphsPerRow = 1;
    var graphsPerColumn = 1;
    var canvasWidth = wrapperWidth;
    var cellWidth = canvasWidth / 4;
    var wrapperHeight = cellWidth;
    var singleData = [];
    var groupData = [];
    var singleSelectedIndex = undefined;
    var groupSelectedIndex = undefined;
    $('#group-btn').click(function() {
        if ($('#group-visualization').hasClass('invisible')) {
            $('#group-visualization').removeClass('invisible');
        }
        $('#single-visualization').addClass('invisible');
        drawBarChart(groupData, groupSelectedIndex);
    });
    $('#single-btn').click(function() {
        if ($('#single-visualization').hasClass('invisible')) {
            $('#single-visualization').removeClass('invisible');
        }
        $('#group-visualization').addClass('invisible');
        drawBarChart(groupData, singleSelectedIndex);
    });

    d3.select('#group-canvas-wrapper')
        .style('height', '495px')
        .style('border', '1px solid #999999');

    d3.select('#single-canvas-wrapper')
        .style('height', wrapperHeight + 'px')
        .style('border', '1px solid #999999');
    d3.json('single-data.json', function(data) {
        singleData = data;
        var dataLen = data.length;
        for (var i = 0; i < dataLen; i++) {
            $('#single-data-selector')
                .append(
                    $('<option></option>')
                    .attr('value', i)
                    .text(data[i]['id'])
                );
        }
        $('#single-data-selector')
            .change(function() {
                var optionSelected = $("option:selected", this);
                singleSelectedIndex = this.value;
                var selectedData = data[this.value].graph;
                var dataLen = selectedData.length;
                graphsPerRow = dataLen;
                var color = d3.scaleOrdinal(d3.schemeCategory20);
                var maxRowCnt = Math.ceil(dataLen / graphsPerRow);
                canvas = d3.select('#single-canvas');
                canvas
                    .attr('width', cellWidth * graphsPerRow)
                    .attr('height', maxRowCnt * cellWidth);
                canvas.selectAll('*').remove();
                var maxNodeCnt = 0;
                for (var i = 0; i < selectedData.length; i++) {
                    var graph = selectedData[i];
                    if (graph.nodes.length > maxNodeCnt) {
                        maxNodeCnt = graph.nodes.length;
                    }
                    var config = {}
                    config.cntPerRow = graphsPerRow;
                    config.cntPerColumn = graphsPerColumn;
                    config.index = i; 
                    config.cellWidth = cellWidth; 
                    drawGraph(graph, config, canvas, color);
                }
                $('#single-node-num').text(maxNodeCnt);
                $('#single-time-num').text(dataLen);
                drawBarChart(groupData, this.value);
            });
    });
    d3.json('group-data.json', function(data) {
        groupData = data;
        var dataLen = data.length;
        for (var i = 0; i < dataLen; i++) {
            $('#group-data-selector')
                .append(
                    $('<option></option>')
                    .attr('value', i)
                    .text(data[i]['id'])
                );
        }
        $('#group-data-selector')
            .change(function() {
                var color = d3.scaleOrdinal(d3.schemeCategory20);
                var optionSelected = $("option:selected", this);
                var selectedData = data[this.value].graph;
                groupSelectedIndex = this.value;
                canvas = d3.select('#group-canvas');
                canvas
                    .attr('width', wrapperWidth)
                    .attr('height', '495px');
                canvas.selectAll('*').remove();
                var config = {}
                config.width = wrapperWidth;
                config.height = 495;
                drawGraph(selectedData, config, canvas, color);
                drawBarChart(groupData, this.value);
            });
    });
})();
