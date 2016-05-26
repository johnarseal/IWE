function initResRate(){

	chartHeight = (parseInt($('#res-rate-wrap').css("width")) * 0.8) + "px";
	$('#res-rate-wrap').css("height",chartHeight)

	$('#res-rate-wrap').highcharts({
		chart: {
			type: 'bar'
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
function drawResRate(){
	
	var transition = "";
	for(i in selectors.tranStr){
		transition += selectors.tranStr[i] + " "
	}
	selectors.transition = transition.substring(0,transition.length-1);
	if(selectors.transition == ""){
		delete selectors.transition;
	}
	
	
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
						//console.log(oldSeries);
						chart.series[j].setData(oldSeries,false);
						break;
					}
				}
			}
			chart.redraw();
		},
		"json"		
	);
}
function initImpactEvent(){
	initResRate();
	drawResRate();
	$("#resDraw").click(function(){
		drawResRate();
	});
	$("#resClear").click(function(){
		var chart = $("#res-rate-wrap").highcharts();           
		
		for(var i in chart.series) {
			chart.series[i].setData([]);
		}
	
		chart.redraw();
	});	
	
}