function drawResRate(data){

	chartHeight = (parseInt($('#res-rate-wrap').css("width")) * 0.5) + "px";
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
		   name: 'Duplicate',
				data: [0.2]
		},
		{
			name: 'NEEDINFO',
				data: [0.4]
		},
		{
			name: 'Fixed',
				data: [0.4]
		}]
	});
}