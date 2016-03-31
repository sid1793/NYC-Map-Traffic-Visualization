////////// MAIN

// Global Variables
var gCamName='';
var gStartTime = new Date('2015-12-05 08:00:00');
var gEndTime = new Date('2015-12-05 14:00:00');
var gStartDate = new Date('2015-12-05 00:00:00');
var gEndDate = new Date('2015-12-20 00:00:00');

var latest_bounding_box;
var lastTimeout;
var time_updated_for_images = false;

var alerttype = "";
var alertsLOC = [];

var imageOn = false;
var markers = new Array();
var cams = [];

var heatmap_switched = false;
var heatType = "car";
var checkbox = document.getElementById("heatmap_on");

var alltweets = [];

var norm_den = 24.0;
var norm_req = false;

var isloading = true;

// making map

var map = L.map('map').setView([40.7841484, -73.9661407], 13);
var tile = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
  maxZoom: 18,
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
  id: 'mapbox.streets'
}).addTo(map);

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    }
});


var wazenumber = 0;

function setWazeNumber(wazenumber){
  document.getElementById("waze").innerHTML = wazenumber
}

function createEvent2(){
  eventname = document.getElementById('eventname').value;
  sT = gStartTime.toLocaleTimeString();
  sD = gStartDate.toLocaleDateString();
  $.post('/event',{
    event_name:eventname,
    bbox:JSON.stringify(latest_bounding_box),
    startTime:sT,
    startDate:sD
  }
  );
}

map.addControl(drawControl);
map.on('draw:created', function (e) {
    latest_bounding_box = e.layer.getLatLngs();
    console.log (latest_bounding_box);
    update_wordcloud ();
});

// scetch camera icons

var cam = L.icon({
    iconUrl: 'static/img/video_camera_black.png',//black
    shadowUrl: 'static/img/video_camera_grey.png',

    iconSize:     [24, 24], // size of the icon
    shadowSize:   [26, 26], // size of the shadow
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    shadowAnchor: [13, 13],  // the same for the shadow
    popupAnchor:  [-3, -10] // point from which the popup should open relative to the iconAnchor
});

var camLayer = L.layerGroup().addTo(map);

$.get( "/camcoords",{}, function( data, status ) {//
  console.log(data.coords[0])
  for (i=0; i<data.coords.length; i++){
    cams.push ({camera: data.coords[i][0], lat: data.coords[i][1],log: data.coords[i][2]});
  }
  console.log(cams[0])
  for(var i = 0; i<cams.length; ++i){
    var marker = L.marker([cams[i].lat,cams[i].log], {icon: cam},{title: cams[i].camera}).addTo(map);
    window.markers.push(marker);
    camLayer.addLayer(marker);
    window.markers[i].bindPopup(cams[i].camera);//originally width=\"352\" height=\"240\" name = "myCam"

    var camID = cams[i].camera;
    window.markers[i].on('click',function(e){//window.markers[i].title

      if (!imageOn){
        imageOn = true;
        gCamName = e.target._popup._content;
        setTimeout(refreshImage,1000,gCamName,gStartTime,gEndTime,gStartTime);
      }
      else {
        if (gCamName == e.target._popup._content){
          imageOn = false;
          try{
            clearTimeout (lastTimeout);
          }
          catch(err){
            console.log (err);
          }
        }
        else {
          gCamName = e.target._popup._content;
          time_updated_for_images = true;
        }
      }      

      console.log(gStartTime);
      console.log(gEndTime);
    });
  }
});

// add dot-map layer

var alertLayer = L.layerGroup().addTo(map);

// HEATMAP

var heatmap = new L.TileLayer.HeatCanvas({},{'step':1,
'degree':HeatCanvas.LINEAR, 'opacity':0.7});

var baseMaps = {};
var overlayMaps ={
  "Cams":camLayer,
  "Dotmap":alertLayer,
  "Heatmap":heatmap
};
L.control.layers(baseMaps,overlayMaps).addTo(map);

document.getElementById("radio1").onclick=function (heatRadio)
{
heatmap_switched = true;
window.heatType = "bus";  
renderAll ();
};
document.getElementById("radio2").onclick=function (heatRadio)
{
heatmap_switched = true;
window.heatType = "car";  
renderAll ();
};
document.getElementById("radio3").onclick=function (heatRadio)
{
heatmap_switched = true;
window.heatType = "person";  
renderAll ();
};

var chb_norm = document.getElementById("heatmap_normal");
chb_norm.onchange=function ()
{
  if (chb_norm.checked)
    norm_req = true;
  else
    norm_req = false;
  renderAll ();
};


// time selection plots

var xfilter, all, date, hour, datesGroup, hoursGroup;
var formatNumber, formatChange, formatDate, formatTime;
var nestByDate;
var charts;
var chart;


$.get( "/alltweets",{}, function( data, status ) {
  console.log(data.tweets[0])
  for (i=0; i<data.tweets.length; i++){
    alltweets.push ({index: i, date: new Date(Date.parse(data.tweets[i][0]))});
  }
  console.log(alltweets[0]);

// Create the crossfilter for the relevant dimensions and groups.
  xfilter= crossfilter(alltweets);
  all = xfilter.groupAll();
  date = xfilter.dimension(function(d) { return d.date; });
  hour = xfilter.dimension(function(d) { return d.date.getHours() + d.date.getMinutes() / 60; });

  datesGroup = date.group(d3.time.day).reduceSum (function(d) { return 1; });
  hoursGroup = hour.group(Math.floor).reduceSum (function(d) { return 1; });

  // d3 stuff
    // Various formatters.
  formatNumber = d3.format(",d");
  formatChange = d3.format("+,d");
  formatDate = d3.time.format("%B %d, %Y");//%B - full month name.%d - zero-padded day of the month as a decimal number [01,31].%Y - year with century as a decimal number.
  formatTime = d3.time.format("%I:%M %p");//%I - hour (12-hour clock) as a decimal number [01,12].%M - minute as a decimal number [00,59].%p - either AM or PM.

    // A nest operator, for grouping the flight list.
  nestByDate = d3.nest()
    .key(function(d) { return d3.time.day(d.date); });

  charts = [
      barChart()
          .dimension(hour)
          .group(hoursGroup)
        .x(d3.scale.linear()
          .domain([0, 24])
          .rangeRound([0, 10 * 24]))
        .filter([8, 14]),

      barChart()
          .dimension(date)
          .group(datesGroup)
          .round(d3.time.day.round)
        .x(d3.time.scale()
          // .domain([new Date(2015, 10, 1), new Date(2015, 11, 31)])
          .domain([new Date(2015, 11, 1), new Date(2016, 1, 3)])
          .rangeRound([0, 10 * 60]))
          // .filter([new Date(2015, 11, 1), new Date(2015, 11, 20)])
        .filter([new Date(2015, 11, 5), new Date(2015, 11, 20)])
  ];

    // Given our array of charts, which we assume are in the same order as the
    // .chart elements in the DOM, bind the charts to the DOM and render them.
    // We also listen to the chart's brush events to update the display.
  chart = d3.selectAll(".chart")
    .data(charts)
    .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });


  renderAll();
});


///////// FUNCTIONS


function wazelevel(a){
  $.post('/wazeAlert',{
    level:a
  },function getData(data){
  console.log('Hi')
  document.getElementById('waze').innerHTML = data.num
  });
}

function update_wordcloud ()
{
    var sD = gStartDate.toLocaleDateString();
    var eD = gEndDate.toLocaleDateString();
    var sT = gStartTime.toLocaleTimeString();
    var eT = gEndTime.toLocaleTimeString();
    $.post('/wordCloud',{
      coord:JSON.stringify(latest_bounding_box),
      startDate: sD,
      endDate: eD,
      startTime: sT,
      endTime: eT
    });
    document.getElementById('word_cloud').src="static/img/wordcloud.png?" + new Date().getTime();  
}



function refreshImage(cName,starttime,endtime,curtime) {//the times are Date object

  var hour = 60 * 60 * 1000;
  var nexttime = new Date(curtime.valueOf()+hour);
  strcurtime = curtime.toLocaleString();
  strstarttime = starttime.toLocaleString();
  strendtime = endtime.toLocaleString();
  strnexttime = nexttime.toLocaleString();


  console.log (endtime);
  console.log (nexttime);
  console.log (endtime.getTime() < nexttime.getTime());


  if(endtime.getTime() < nexttime.getTime() ){
    $.get( "/images",{camname:cName, starttime: strcurtime,endtime: strendtime}, function( data, status ) {//
      //console.log(data);
      if(data.length>100){
        document.getElementById("myPic").src='data:image/jpeg;base64, '+data+'';
      }
    });
    curtime = starttime;
  }else{
    //document.getElementById(imageID).src ="data:image/jpeg;base64, '+data+'?math=';
    $.get( "/images",{camname:cName,starttime:strcurtime ,endtime:strnexttime}, function( data, status ) {//   
      //console.log(data);
      if(data.length>100){
        document.getElementById("myPic").src='data:image/jpeg;base64, '+data+'';
      }
    });
    curtime = nexttime;
  }

  if (time_updated_for_images){
    lastTimeout = setTimeout(refreshImage,1000,gCamName,gStartTime,gEndTime,gStartTime);
    time_updated_for_images = false;
  }
  else
    lastTimeout = setTimeout(refreshImage,1000,cName,starttime,endtime,curtime);

  $.post("/objects",{
          name : JSON.stringify(cName)
      },function(data){
        console.log(typeof(data))
        data = JSON.parse(data)
        document.getElementById("car").innerHTML=data[0];
        document.getElementById("bus").innerHTML=data[1];
        document.getElementById("person").innerHTML=data[2];
      });

}


function alert_type(type,name){//e.g.true, hazard
  
  if (type){
		alerttype = name;
		var alertBtn = document.getElementById("alertBtn");
		alertBtn.innerHTML=name+"<span class='caret'></span>";
  }
  
  var sD = gStartDate.toLocaleDateString();
  var eD = gEndDate.toLocaleDateString();
  var sT = gStartTime.toLocaleTimeString();
  var eT = gEndTime.toLocaleTimeString();

  $.get( "/alerts",{typename:alerttype, startD: sD, startT: sT, endD: eD, endT: eT}, function( data, status ) {//
    alertsLOC = data.coords;
    console.log(alertsLOC[0]);

    console.log(alertsLOC.length);
    alertLayer.clearLayers();
    for (var i = alertsLOC.length - 1; i >= 0; i--) {
      var c = L.circle(alertsLOC[i], 20, { color : 'green', opacity:1, fillColor: 'green',fillOpacity: 1 });
      alertLayer.addLayer(c);
    }

  });

}

/*
function renderHeat ()
{
	window.heatmap.data = [];

	points.forEach (function (d, i) {

<<<<<<< HEAD
	  var val = d.value;
	  if (norm_req)
	    val /= norm_den / 5.0;

	  window.heatmap.pushData(lat, log, val);   
	});

	if(checkbox.checked == true){
	  window.heatmap.redraw ();
	}
}
*/


function setTime(time,num){
  var hour = Math.floor(num);
  var min = (num - hour)*60;
  time.setHours(hour,min);
  //time.setMinutes();
}
function setDate(date,dObj){
  date = new Date(dObj.getFullYear(),dObj.getMonth(), dObj.getDate(), 0,0,0,0);
}


function switch_heatmap(){
    if(checkbox.checked == true){
        map.addLayer(heatmap);
    }
    else {
        map.removeLayer(heatmap);
    }
};


//D3 FUNCTIONS

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
    d3.select("#active").text(formatNumber(all.value()));
  }

  // Like d3.time.format, but faster.
  function parseDate(d) {
    return new Date(
        d.substring(0, 4),
        d.substring(5, 7) - 1,
        d.substring(8, 10),
        d.substring(11, 13),
        d.substring(14, 16),
        d.substring(17, 19));
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([100, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");


          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            extent = brush.extent();
            //gStartTime = extent[0];
            //gEndTime = extent[1];
            //this is initialization
            // console.log("extent[0]: ");
            // console.log(extent[0]);
            // console.log("extent[0] type: "+typeof(extent[0]));
            // console.log("typeof(extent[0]) = typeof(new Date())"+ (typeof(extent[0]) == typeof(new Date())));//true
            //console.log("gStartTime: "+gStartTime);
            //console.log("gEndTime: "+gEndTime);
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();

      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);


      if(id == 0){
        gStartTime.setHours (extent[0])
        gStartTime.setMinutes ((extent[0]-Math.floor(extent[0])) * 60)
        gStartTime.setSeconds ((extent[0]*100-Math.floor(extent[0]*100)) * 60)

        gEndTime.setHours (extent[1])
        gEndTime.setMinutes ((extent[1]-Math.floor(extent[1])) * 60)
        gEndTime.setSeconds ((extent[1]*100-Math.floor(extent[1]*100)) * 60)

      }else{
        gStartDate.setTime (extent[0].getTime())
        gEndDate.setTime (extent[1].getTime())
      }

      if (id == 0){
        norm_den = extent[1] - extent[0];
        if (norm_den == 0)
          norm_den = 24.0;
      }
  
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();

		if(id == 0){
			gStartTime = new Date('2015-12-05 00:00:00');
			gEndTime = new Date('2015-12-05 23:59:59');
		}else{
			gStartDate = new Date('2015-12-01 00:00:00');
			gEndDate = new Date('2016-02-03 00:00:00');
		}
      }

	  alert_type(false,"");
      time_updated_for_images = true;
      update_wordcloud ();

    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.yDomain = function(_) {
      if (!arguments.length) return y;
      y.domain (_);
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }
