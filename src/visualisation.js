function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
    }
    return urlparameter;
}

var mytext = getUrlParam('dataset','data/example.json');

console.log(mytext);

const request = new XMLHttpRequest();
request.open("GET", mytext, false);
request.send(null);
const jsonSource = JSON.parse(request.responseText);

const width = 840;
const height = 720;
const pathsHeight = 60;
let svg = d3.select("#visualisation").attr("width", width).attr("height", height);
var slider = d3.select("#zoomRange");

let circlesSvg = d3.select("#selectedPath").attr("width", width);
var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
var h = circlesSvg.append("g");
var f = circlesSvg.append("svg");

var tip = d3.tip().attr('class', 'd3-tip').direction('e').offset([0,5])
    .html(function(d) {
        var content =`
                    <table style="margin-top: 2.5px;">
                            <tr><td>Url: </td><td style="text-align: right">` + (d.data.url) + `</td></tr>
                            <tr><td>Id: </td><td style="text-align: right">` + (d.data.id) + `</td></tr>
                    </table>
                    `;
        return content;
    });
svg.call(tip);


var links = createLinks(jsonSource);
var nodesArray = createNodes(links);
var paths = createPaths(jsonSource, links);

var root;
var focus;
var nodes;
var pack;
var circle;
var pathCircle;
var pathCircleText;
var pathArrow;
var text;
var node;
var view;
var linksLeft = [];
var linksRight = [];
var screenLeftLinks;
var screenRightLinks;
var circlesPath;
var arrowsPath;

function paintTree(focusNode, depth, leftLinks, rightLinks ){
    margin = 0;


    root = buildTree(focusNode, maxActiveDepth);

    var maximalLevelOfZoom = maxDepth;

    console.log("\n");

    console.log("max: ");
    console.log((maximalLevelOfZoom + activeRootLevel).toString());
    console.log("\n");

    console.log("value: ");
    console.log((activeRootLevel + activeDepth).toString());
    console.log("\n");

    //slider.attr('max', (maximalLevelOfZoom + activeRootLevel).toString() ).attr('value', (activeRootLevel + activeDepth).toString());
    document.getElementById("zoomRange").value = activeRootLevel + activeDepth;
    document.getElementById("zoomRange").max = maximalLevelOfZoom + activeRootLevel;

    root = buildTree(focusNode, depth);

    slider.attr('max', (maximalLevelOfZoom + activeRootLevel) ).attr('value', (activeRootLevel + activeDepth));

    if (activePath != undefined){

        let pathColor = d3.scaleLinear()
            .domain([0, activePath.height])
            .range(["#ff8d92", "#ff0000"])
            .interpolate(d3.interpolateCubehelix);

        let queue = [];

        queue.push(root);


        let visualArray = [];

        while (queue.length != 0 ){
            let node = queue.shift();
            visualArray.push(node);
            if ( node.children != null && node.children != undefined ){
                for (let i = 0; i < node.children.length ; i++){
                    queue.push(node.children[i]);
                }
            }
        }

        for (let i = 0; i < activePath.vertices.length; i++){
            let n = visualArray.filter( y => y.url === activePath.vertices[i])[0];

            if (n!= undefined){
                let j = i / 2;
                n.color = pathColor();
            }
        }

        let tmpUp = activePath.up;
        let tmpDown = activePath.down;

        let indexLeft = 0;
        let indexRight = 0;

        activePath.colours = [];

        for (let i = 0; i < (activePath.vertices.length); i++){
            let n = visualArray.filter( y => y.url === activePath.vertices[i])[0];

            let j = 0;

            if (tmpUp > 0 ){
                j = indexLeft * activePath.height / activePath.up;

                indexLeft++;
                tmpUp--;

            } else {
                j = (activePath.height - indexRight) * activePath.height / activePath.down;
                indexRight++;
            }

            activePath.colours.push(pathColor(j));

            if (n != undefined){
                n.color = pathColor(j);
            }
        }

        let count = 2 * activePath.vertices.length + activePath.directions.length;
        let r = 2* width / count;
        let space = r / 2;
        arrowsPath = [];
        circlesPath = [];
        var selectedPathHeight = 200;

        for ( let i = 0 ; i < activePath.vertices.length; i++){
            let node = {};
            node.x = i * r + i * space + r/2;
            node.y = selectedPathHeight / 2;
            node.color = activePath.colours[i];
            node.r = 25;
            node.text = activePath.vertices[i];
            circlesPath.push(node);
        }
        for (let i = 0; i < activePath.directions.length; i++){
            let arrow = {};
            if (activePath.directions[i] === 1) {
                arrow.text = "↑";
            } else {
                arrow.text = "↓";
            }
            arrow.y = selectedPathHeight / 2;
            arrow.x = (i + 1) * r + i * space + space /2 ;
            arrowsPath.push(arrow);
        }

        circlesSvg = d3.select("#selectedPath").attr("height", selectedPathHeight);

        h.remove();
        f.remove();
        h = circlesSvg.append("g").attr("width", width).attr("height", r);
        f = circlesSvg.append("svg").attr("width", width).attr("height", r);

        pathCircle = h.selectAll("circle")
            .data(circlesPath)
            .enter()
            .append("circle")
            .attr("cx", function (d) {return d.x;})
            .attr("cy", function (d) {return d.y;})
            .attr("fill", function (d) {return d.color;})
            .attr("class", "hint-node")
            .attr("r", function (d) {return d.r;})
            .on("click", hintCircleFunction);

        pathCircleText = f.selectAll("text")
            .data(circlesPath)
            .enter()
            .append("text")
            .attr("x", function (d) {return d.x;})
            .attr("y", function (d) {return d.y;})
            .attr("font-size", "20px")
            .attr("class", "hint-label")
            .text(function(d) { return d.text; });

        pathArrow = h.selectAll("text")
            .data(arrowsPath)
            .enter()
            .append("text")
            .attr("x", function (d) {return d.x;})
            .attr("y", function (d) {return d.y;})
            .attr("font-size", "20px")
            .text(function(d) { return d.text; });
    } else {
        h.remove();
        f.remove();
    }

    pack = d3.pack()
        .size([width - margin, height - margin])
        .padding(10);

    root = d3.hierarchy(root)
        .sum(d => Math.sqrt(d.value));

    focus = root,
        nodes = pack(root)
            .descendants(),
        view;


    let color = d3.scaleLinear()
        .domain([0, depth])
        .range(["HSL(0, 0%, 80%)", "HSL(0, 0%, 20%)"])
        .interpolate(d3.interpolateCubehelix);

    g.remove();
    g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


    circle = g.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
        .style("fill", function(d) { return d.data.color ? d.data.color : color(d.depth) })
        .on("click", clickFunction)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    text = g.selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", function(d) { return d.parent ? d.children ? "label" : "label label--leaf" : "label label--root"; })
        .style("fill", "white")
        .style("font-size", function(d) { return Math.min(d.r/3, ( d.r - 16) / this.getComputedTextLength() * 5) + "px"; })
        .attr("dy", ".35em")
        .text(function(d) {
            if ( d.data.url.startsWith("https://www.wikidata.org/wiki") ) {
                return d.data.url.split('/')[4].substring(0,4)+"...";
            } else {
                if ( d.data.url.length < 4 ) {
                    return d.data.url;
                } else {
                    return d.data.url.substring(0,4)+"...";
                }
            }
        });

    node = g.selectAll("circle,text");

    svg
        .style("background", "white")
        .on("click", function () {
            activeRootLevel = 0;
            activeDepth = 1;
            activeRootPath = [];
            zoom(0);
        });

    zoomTo([root.x, root.y, root.r * 2 + margin]);
    //bude rozbocovac podle toho v jakem jsem modu

    if (leftLinks != null || rightLinks != null){
        createNewLinks(leftLinks, rightLinks);
        paintLinks();
    }
}

function clickFunction(d){
    console.log(d);

    activeDepth = 1;

    var nodeInArray = nodesArray.filter( p => p.url === d.data.url)[0];
    if ( nodeInArray.children.length !== 0 ) {
        var tmpRoot = d;

        var tmpArr = [];

        var heightBeforeActiveRoot = 0;

        while ( tmpRoot.parent != null ) {
            heightBeforeActiveRoot += 1;
            tmpRoot = tmpRoot.parent;
            tmpArr.push(tmpRoot);

        }

        while ( tmpArr.length != 0  ){
            var item = tmpArr.pop();
            activeRootPath.push(item.data.id);
        }

        activeRootLevel += heightBeforeActiveRoot;

        console.log(activeRootLevel);

        if (d.data.id != undefined){
            activeRootId = d.data.id;
        }
        zoom(d);
    }
    d3.event.stopPropagation();
}

function hintCircleFunction(d){
    focusHintNode(d);
    d3.event.stopPropagation();
}

function focusHintNode(d) {
    activeRootId = parseInt(d.text);
    paintTree(activeRootId, activeDepth, leftMapNodes, rightMapNodes);
}

function zoom(d) {
    if (d === 0) {
        activeRootId = 0;
    } else {
        activeRootId = d.data.id;
    }
    paintTree(activeRootId, activeDepth, leftMapNodes, rightMapNodes);
}

function zoomTo(v) {
    var k = height / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
}

function createLayer(urls){
    let layerArray = [];

    for (let i = 0 ; i < urls.length; i++){
        let n = nodesArray.filter( y => y.url === urls[i])[0];

        if ( n === undefined){
            continue;
        }

        let stack = [];

        stack.push(n);

        let j = 0;

        cycleArray = [];

        while (stack.length != 0 ){
            let parent = stack.pop();
            j++;
            if (parent === undefined){
            }

            if (cycleArray.includes(parent.id)){
                cycleArray = [];
                continue;
            }

            if (parent.parents === null){
                cycleArray = [];
                continue;
            }
            cycleArray.push(parent.id);
            if ( parent.depth != activeDepth ){
                if (parent.parents != null){
                    for (let j = 0 ; j < parent.parents.length; j++){
                        stack.push(parent.parents[j]);
                    }
                }
            } else {
                if (!layerArray.includes(parent.id)){
                    layerArray.push(parent.id);
                }
            }
        }
    }
    return layerArray;
}


function createNewLinks(lefts, rights){
    linksLeft = [];
    linksRight = [];
    let queue = [];
    let screenLevel = [];
    queue.push(root);

    while (queue.length != 0){
        let vertex = queue.shift();
        if (vertex.depth === activeDepth){
            screenLevel.push(vertex);
        } else {
            if (vertex.children != undefined && vertex.children != null){
                for ( let i = 0 ; i < vertex.children.length; i++){
                    queue.push(vertex.children[i]);
                }
            }
        }
    }

    if (lefts != null && lefts != undefined){
        let leftDepthLevel = createLayer(lefts);

        for (let i = 0 ; i < leftDepthLevel.length; i++){
            let targetNode = screenLevel.filter( x => x.data.id === leftDepthLevel[i])[0];
            let l = {};
            let lobj = {};
            lobj.x = 0;
            lobj.y = height / 2;
            l.from = lobj;
            let robj = {};
            robj.x = targetNode.x;
            robj.y = targetNode.y;
            robj.r = targetNode.r;
            l.to = robj;
            linksLeft.push(l);
        }
    }

    if (rights != null && rights != undefined){
        let rightDepthLevel = createLayer(rights);

        for (let i = 0 ; i < rightDepthLevel.length; i++){
            let targetNode = screenLevel.filter( x => x.data.id === rightDepthLevel[i])[0];
            let l = {};
            let lobj = {};
            lobj.x = width;
            lobj.y = height / 2;
            l.from = lobj;
            let robj = {};
            robj.x = targetNode.x;
            robj.y = targetNode.y;
            robj.r = targetNode.r;
            l.to = robj;
            linksRight.push(l);
        }
    }
}



function paintLinks(){

    if (screenLeftLinks !== undefined){
        screenLeftLinks.remove();
    }
    if (screenRightLinks !== undefined){
        screenRightLinks.remove();
    }

    svg.append("svg:defs").append("svg:marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr('refX', 9)//so that it comes towards the center.
        .attr("markerWidth", 11)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .attr("fill", "yellow")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    screenLeftLinks = svg.selectAll('links')
        .data(linksLeft)
        .enter().append('svg:line')
        .attr("class", "links")
        .attr("stroke", "yellow")
        .style('stroke-width', 2)
        .attr("x1", function(d) { return d.from.x; })
        .attr("y1", function(d) { return d.from.y; })
        .attr("x2", function(d) { return (d.to.x - d.to.r / 5 * 2); })
        .attr("y2", function(d) { return d.to.y; })
        .attr('marker-end', (d) => "url(#arrow)");

    screenRightLinks = svg.selectAll('links')
        .data(linksRight)
        .enter().append('svg:line')
        .attr("class", "links")
        .attr("stroke", "yellow")
        .style('stroke-width', 2)
        .attr("x1", function(d) { return d.from.x; })
        .attr("y1", function(d) { return d.from.y; })
        .attr("x2", function(d) { return (d.to.x + d.to.r / 5 * 2); })
        .attr("y2", function(d) { return d.to.y; })
        .attr('marker-end', (d) => "url(#arrow)");
}