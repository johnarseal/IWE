function initResTime(data){
	var chartHeight = (parseInt($('#fix-time-wrap').css("width")) * 0.7) + "px";
	$('#fix-time-wrap').css("height",chartHeight);
	$('#fix-time-wrap').highcharts({
			chart:{type:"line"},
			title: {
				text:null,
				margin:0
			},
			yAxis: {
				title: {
					enabled:false
				},
				labels: {
					formatter: function() {
						return ((this.value) * 100) + "%";
					}
				},
				tickInterval:0.1,
				max:1,
				plotLines:[{
					color: '#FF0000',
					value: 0.9,
					width: 2,
					label:{
						text:"90%",
						x:-5
					}
				}]
			},
			xAxis:{
				title: {
					text: 'days',
					align: 'low',
					margin:0,
					offset:20
				}
			},
			tooltip:{
				formatter:function(){
					var s = '<b>' + this.y*100 + '%</b> Bugs Get Resolved in<br/>'+ this.x + 'days ';
					return s;
				},
				crosshairs: [true]
			},
			credits: {
				enabled:false
			},
			series: [{data:data,name:"All"}],
			legend: {
				labelFormatter: function () {
					var text = this.name,
					formatted = text.length > 25 ? text.substring(0, 25) + '...' : text;

                    return '<div class="js-ellipse" style="max-width:50px; overflow:hidden" title="' + text + '">' + formatted + '</div>';
				},
				useHTML:true
			}
	});
}

function initResRate(rrData,resolution){

	chartHeight = (parseInt($('#res-rate-wrap').css("width")) * 0.8) + "px";
	$('#res-rate-wrap').css("height",chartHeight)
	
	// process the data
	var totalNum = 0;
	for(var i in rrData){
		totalNum += rrData[i][1];
	}
	var rrDict = {}
	for(var i in rrData){
		rrDict[rrData[i][0]] = parseFloat((rrData[i][1]/totalNum));
	}
	var resTag = resolution.slice(0);
	resTag.shift();
	resTag.unshift("NONE");
	var resColor = {NONE:"#7cb5ec",EXPIRED:"#434348",WORKSFORME:"#2b908f",INCOMPLETE:"#f7a35c",INVALID:"#8085e9",MOVED:"#f15c80",WONTFIX:"#e4d354",DUPLICATE:"#EE0000",FIXED:"#90ed7d"};
	var dataSeries = new Array();
	var fixTmp;
	for (i in resTag){
		var res = resTag[i];
		if (res == "FIXED"){
			fixTmp = {name:res,color:resColor[res],data:[rrDict[res]]};
		}
		else{
			dataSeries.push({name:res,color:resColor[res],data:[rrDict[res]]});
		}
	}
	dataSeries.push(fixTmp);
	// set categories
	var cat = parseSelectors(selectors);
	
	$('#res-rate-wrap').highcharts({
		chart: {
			type: 'bar',
			events: {
                load: function (event) {
                    $('.js-ellipse').tooltip();
                }
            }
		},
		title: {
			text: null,
			margin:0
		},
		tooltip:{
			formatter: function () {
                return "<b>" + this.series.name + "</b> " + (parseFloat(this.y)*100).toFixed(1) + "%";
            }
		},
		yAxis: {
			min: 0,
			max: 1,
			title: {
				text:"rate",
				margin:0,
				offset:20
			},
		},
		xAxis:{
			categories:[cat],
            labels: {
				formatter: function () {
					var text = this.value,
					formatted = text.length > 25 ? text.substring(0, 25) + '...' : text;

                    return '<div class="js-ellipse" style="width:20px; overflow:hidden" title="' + text + '">' + formatted + '</div>';
				},
				style: {
					width: '150px'
				},
				useHTML: true
			}
		},
		legend: {
			reversed: true,
			verticalAlign: 'top',
			margin:0,
			maxHeight:80
		},
		plotOptions: {
			series: {
				stacking: 'normal'
			}
		},
		credits: {
		  enabled:false
		},
		series: dataSeries
	});
}
function drawResRate(){
	
	initSelTran();
	
	$.get(
		"/iwe/api/resrate",
		selectors,
		function(data){
			var chart = $("#res-rate-wrap").highcharts();
			var totalNum = 0;
			var seriesData = new Array();
			for(var i in data){
				totalNum += data[i][1];
			}
			for(var i in data){
				seriesData.push({name:data[i][0],data:parseFloat((data[i][1]/totalNum))});
			}
			//var oldSeries = chart.series;
			for(var j in chart.series){
				var hasKey = false;
				for(i in seriesData){
					if(chart.series[j].name == seriesData[i].name){
						oldSeries = chart.options.series[j].data;
						oldSeries.push(seriesData[i].data);
						chart.series[j].setData(oldSeries,false);
						hasKey = true;
						break;
					}
				}
				if(!hasKey){
					oldSeries = chart.options.series[j].data;
					oldSeries.push(0);
					chart.series[j].setData(oldSeries,false);
				}
			}
			var oldCat = chart.xAxis[0].categories;
			oldCat.push(parseSelectors(selectors));
			chart.xAxis[0].setCategories(oldCat);
			chart.redraw();
		},
		"json"		
	);
}
function drawResTime(){
	initSelTran();

	var chart = $("#fix-time-wrap").highcharts();
	$.get(
		"/iwe/api/restime",
		selectors,
		function(data){
			var newName = parseSelectors(selectors);
			chart.addSeries({data:data,name:newName});
		},
		"json"		
	);
}
function initImpactEvent(){
	
	$("#resolutionDraw").click(function(){
		drawResRate();
	});
	$("#resolveTimeDraw").click(function(){
		drawResTime();
	});
	$("#resolutionClear").click(function(){
		var chart = $("#res-rate-wrap").highcharts();           
		
		for(var i in chart.series) {
			chart.series[i].setData([]);
		}
		chart.xAxis[0].setCategories([]);
		chart.redraw();
	});	
}

