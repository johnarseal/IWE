
//selector of total bug number over time
function initTimeTotal(chartId,data){
        // Create the chart
		var navHeight = parseInt($(chartId).css("height")) * 0.35;
        $(chartId).highcharts('StockChart', {
			
            rangeSelector : {
                enabled:false
            },
			credits: {
					  enabled:false
			},
            series : [{
                name : 'total number of bugs',
                data : data
            }],
			navigator:	{
				height:navHeight,
				margin:5
			}
        });
}