function initResTime(){
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
				}
			},
			credits: {
				enabled:false
			},
			series: [],
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
function initSelTran(){
	var transition = "";
	for(i in selectors.tranStr){
		transition += selectors.tranStr[i] + " "
	}
	selectors.transition = transition.substring(0,transition.length-1);
	if(selectors.transition == ""){
		delete selectors.transition;
	}
}
function initResRate(){

	chartHeight = (parseInt($('#res-rate-wrap').css("width")) * 0.8) + "px";
	$('#res-rate-wrap').css("height",chartHeight)

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
		xAxis:{
			labels:{
				enabled:false
			}
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
			categories:[],
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
			margin:0
		},
		plotOptions: {
			series: {
				stacking: 'normal'
			}
		},
		credits: {
		  enabled:false
		},
		series: [{
		   name: "NONE",
				data: [],
				color:"#7cb5ec"
		},
		{
			name: "EXPIRED",
				data: [],
				color:"#434348"
		},
		{
			name: "WORKSFORME",
				data: [],
				color:"#2b908f"
		},
		{
			name: "INCOMPLETE",
				data: [],
				color:"#f7a35c"
		},
		{
			name: "INVALID",
				data: [],
				color:"#8085e9"
		},
		{
			name: "MOVED",
				data: [],
				color:"#f15c80"
		},
		{
			name: "WONTFIX",
				data: [],
				color:"#e4d354"
		},
		{
			name: "DUPLICATE",
				data: [],
				color:"#EE0000"
		},
		{
			name: 'FIXED',
				data: [],
				color:"#90ed7d"
		}]
	});
}
function parseSelectors(selectors){
	var retStr = "";
	for(var s in selectors){
		if(s != "tranStr"){
			retStr += selectors[s] + " ";
		}
	}
	if(retStr == ""){
		retStr = "All";
	}
	return retStr;
}
function drawResRate(){
	
	initSelTran();
	
	$.get(
		"/api/resrate",
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
			for(var i in seriesData){
				for(var j in chart.series){
					if(chart.series[j].name == seriesData[i].name){
						oldSeries = chart.options.series[j].data;
						oldSeries.push(seriesData[i].data);
						chart.series[j].setData(oldSeries,false);
						break;
					}
				}
			}
			var oldCat = chart.xAxis[0].categories;
			oldCat.push(parseSelectors(selectors));
			chart.xAxis[0].setCategories(oldCat)
			chart.redraw();
		},
		"json"		
	);
}
function drawResTime(){
	initSelTran();

	var chart = $("#fix-time-wrap").highcharts();
	$.get(
		"/api/restime",
		selectors,
		function(data){
			var newName = parseSelectors(selectors);
			chart.addSeries({data:data,name:newName});
		},
		"json"		
	);
}
function initImpactEvent(){
	initResRate();
	drawResRate();
	initResTime();
	drawResTime();
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
	
		chart.redraw();
	});	
}

