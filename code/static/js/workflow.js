// the ts of every node represents the 
// time gap between its parent and itself
function parseTree(d){
	//caculate the time gap
	for (tranStr in d)
	{
		var initST = d[tranStr]["ts"][0];
		d[tranStr]["ts"][0] = 0;
		for (i = 1; i < d[tranStr]["ts"].length; i++)
		{
			d[tranStr]["ts"][i] -= initST + d[tranStr]["ts"][i-1];
		}
	}
	var tagDict = {
	"NEW":"NEW","ASSIGNED":"ASS","UNCONFIRMED":"UNC","RESOLVED":"RES","VERIFIED":"VER","REOPENED":"REO"
	}
	//build a tree
	var nodeId = 0;
	var rr = {"child":{},"tag":"root",id:nodeId++};
	var mergeThres = 0.2;
	for (tranStr in d){
		var tranArr = tranStr.split(" ");
		var curNode = rr;
		var tranAttr = d[tranStr];
		var endInd = tranArr.length - 1;
		//iterate through a transition str
		for (i in tranArr){
			var curTran = tranArr[i];
			// check whether to merge the node
			// find a node to merge
			ind = 0;
			tranStr = curTran;
			curTran = curTran + ind;
			if (i > 0) {
				while(curTran in curNode["child"]) {
					oldGap = curNode["child"][curTran]["ts"];
					newGap = tranAttr["ts"][i];
					gapDiff = Math.abs(oldGap-newGap);
					// if the gap difference is small, merge
					if(gapDiff <= oldGap * mergeThres){
						break;
					}
					else{
						ind++;
						curTran = tranStr + ind;
					}
				}
			}
			// merge or not
			if(curTran in curNode["child"]){
				curNode = curNode["child"][curTran];
				// average the ts
				totalNum = curNode["num"] + tranAttr["num"]
				curNode["ts"] = parseInt((curNode["num"] * curNode["ts"] + tranAttr["num"] * tranAttr["ts"][i]) / totalNum);
				curNode["num"] = totalNum;
			}
			else{		// a new node
				curNode["child"][curTran]={"child":{},"tag":tagDict[tranStr],"id":nodeId++,"parentId":curNode.id};
				curNode = curNode["child"][curTran];
				curNode["num"] = tranAttr["num"];
				curNode["ts"] = tranAttr["ts"][i];
			}
			// if it is an end, add a node
			if(i == endInd){
				curNode["child"]["END"] = {"num":tranAttr["num"],"ts":tranAttr["ts"][i]};
			}
		}
	}
	return rr;
}


// find the number of child node of each node
function searchWidth(node){
	var hasChild = false;
	for(childStr in node["child"]){
		if (childStr != "END"){
			hasChild = true;
			break;
		}
	}
	if(!hasChild){
		node["maxWidth"] = 1;
		return 1;
	}
	maxWidth = 0;
	for(childStr in node["child"]){
		if (childStr != "END"){
			maxWidth += searchWidth(node["child"][childStr]);
		}
	}
	node["maxWidth"] = maxWidth;
	return maxWidth;
}


//build the scale of the work flow chart
//including the cy of each node
function buildScale(svgAttr,r){
		
	// a series of rate
	var innerGapRate = 0.5;
	var widthLineNodeRate = 0.8;
	var minLineWidth = 2;
	var maxLineWidth = 20;
	var minLineLen;
	
	// to find the maximum and minimal value in the tree
	// in order to build the scale
	var maxTS = maxNUM = 0;
	var minTS = minNUM = 999999999;
	var tDepth = 0;
	var nodeIndArr = new Array();
	nodeIndArr[0] = {"child":[],"id":0,"totalTS":999999999};
	function traverseTree(node,lTs,depth){
		if(node.tag != "root"){
			if(node.ts != 0){
				minTS = Math.min(node.ts,minTS);
			}
			if(node.num != 0){
				minNUM = Math.min(minNUM,node.num);
			}
			tDepth = Math.max(tDepth,depth);
			lTs += node.ts;
			node.totalTS = lTs;
			nodeIndArr[node.id] = {"child":[],"totalTS":lTs,"parentId":node.parentId,"id":node.id,"num":node.num};
			if(node.parentId==0){
				nodeIndArr[0].child.push(node.id);
			}
			for (childStr in node.child){
				if(childStr != "END"){
					nodeIndArr[node.id]["child"].push(node.child[childStr].id);
				}
			}			
			maxTS = Math.max(maxTS,lTs);
			maxNUM = Math.max(maxNUM,node.num);	
		}
		for (childStr in node.child){
			if(childStr != "END"){
				traverseTree(node.child[childStr],lTs,depth+1);
			}
		}
	}
	traverseTree(r,0,0);
	function tsSort(a,b){
		return a.totalTS - b.totalTS;
	}
	nodeArr = nodeIndArr.slice(0);
	nodeArr.sort(tsSort);
	
	// set the maxR according to the width
	maxR = (svgAttr.width - svgAttr.paddingH * 2) / ((innerGapRate + 2) * r.maxWidth - innerGapRate);
	// if the maxR is too big, reduce it.
	if(tDepth * maxR * 2 > (svgAttr.height - svgAttr.paddingV * 2)){
		maxR = (svgAttr.height - svgAttr.paddingV * 2) * 0.8 / (tDepth * 2);
	}
	minR = maxR * 0.5;
	minLineLen = minR * 0.4;
	//scale of the radius	
	crScale = d3.scale.linear()
		.domain([minNUM, maxNUM])
        .range([minR, maxR]);
	
	//scale of the width of edge in the tree
	maxLineWidth = Math.min(maxR * widthLineNodeRate,maxLineWidth);
	edgeWidthScale = d3.scale.linear()
		.domain([minNUM, maxNUM])
        .range([minLineWidth, maxLineWidth]);
	
	// directly find the cy of each node
	var lastTS = 0;
	var topCY = svgAttr.paddingH + maxR;
	var lastCY = topCY;
	var bottomTS = nodeArr[nodeArr.length - 2].totalTS;
	var bottomCY = svgAttr.height - svgAttr.paddingH - crScale(minR);
	var nodeNUM = nodeArr.length - 1;
	for (var i = 0; i < nodeNUM; i++){
		var idealCY = lastCY + ((nodeArr[i].totalTS - lastTS) / (bottomTS - lastTS)) * (bottomCY - lastCY);
		var minCY = 0;
		if(nodeArr[i].parentId != 0){
			minCY = nodeIndArr[nodeArr[i].parentId].cy + crScale(nodeIndArr[nodeArr[i].parentId].num) + minLineLen + crScale(nodeArr[i].num);		
		}
		nodeIndArr[nodeArr[i].id].cy = lastCY = Math.max(idealCY,minCY);
		lastTS = nodeArr[i].totalTS;
	}
		
	// prepare the data for drawing the axis
	var axisD = new Array();
	var scaleInd = [0,parseInt(nodeNUM / 2), nodeNUM-1];
	for (var i in scaleInd){
		var nodeInfo = nodeIndArr[nodeArr[scaleInd[i]].id];
		var oneScale = {"scale":nodeInfo.cy,"text":nodeInfo.totalTS};
		axisD.push(oneScale);
	}

 
	var trScale = {"crScale":crScale,"edgeWidthScale":edgeWidthScale,"nodeIndArr":nodeIndArr,"axisD":axisD};
	return trScale;
}


//draw a single node
function drawNode(node,cx,cy,cr,svg,svgAttr){
	svg.append("circle").attr("cx",cx)
						.attr("cy",cy)
						.attr("r",cr)
						.attr("class","mycir")
						.attr("fill",svgAttr.colors.node[node.tag])
						.attr("stroke",svgAttr.colors.nodeBorder)
						//.attr("stroke-opacity",0.8)
						.attr("stroke-width",6)
						.attr("class","nodeTrigger")
						.attr("id",node.id+"-cir");
						
	svg.append("text").attr("x",cx)
						.attr("y",cy)
						.attr("text-anchor","middle")
						.attr("fill",svgAttr.colors.text)
						.attr("dy",".25em")
						.text(node.tag)
						.attr("id",node.id+"-cirtxt")
						.attr("class","nodeTrigger")
						.style("cursor","default");
}


// draw the upper edge
function drawEdge(lEdgeX,lEdgeY,node,cx,cy,cr,edgeWidth,svg,svgAttr){
	//draw the edge
	if(lEdgeX != 0 && lEdgeY != 0){
		if(Math.abs(lEdgeX - cx) < 1){
			svg.append("line").attr("x1",lEdgeX)
						.attr("y1",lEdgeY)
						.attr("x2",cx)
						.attr("y2",cy - cr)
						.attr("id",node.id+"-upline")
						.style("stroke",svgAttr.colors.edge)
						.style("stroke-width",edgeWidth);			
		}
		else{
			var curRate = 0.4;
			var distY = cy - cr - lEdgeY;
			var turningY = lEdgeY + distY * curRate;
			var dParam = "M "+ lEdgeX + "," + (lEdgeY - edgeWidth * 0.5) + " Q " + cx + "," + lEdgeY + " " + cx + ","+ turningY;
			svg.append("path").attr("d",dParam)
							.attr("fill","none")
							.attr("id",node.id+"-uppath")
							.style("stroke",svgAttr.colors.edge)
							.style("stroke-width",edgeWidth);
			svg.append("line").attr("x1",cx)
							.attr("y1",turningY)
							.attr("x2",cx)
							.attr("y2",cy - cr)
							.attr("id",node.id+"-upline")
							.style("stroke",svgAttr.colors.edge)
							.style("stroke-width",edgeWidth);	
		}
	}
}


//draw the whole tree
function drawTree(lEdgeX,lEdgeY,node,left,right,treeScale,svg,svgAttr){
		
	// compute the cx,cy,cr first
	var cx,cy,cr;
	if(node.tag != 'root'){
		cx = (left + right) / 2;
		cy = treeScale.nodeIndArr[node.id].cy;
		cr = treeScale.crScale(node.num);
		//draw the upper edge
		var edgeWidth = treeScale.edgeWidthScale(node.num);
		drawEdge(lEdgeX,lEdgeY,node,cx,cy,cr,edgeWidth,svg,svgAttr);
	}
	else{
		//var thisEdge = lastEdge;
		cx = cy = 0;
	}

	//sort the child, draw the biggest first
	var totalChildNum = 0;
	function tranSort(a,b){
		return b.num - a.num;
	}
	// both sort and find the min ts among the children
	var tranSortArr = new Array();
	var minChildCY = 9999999;
	var minChildId;
	var endNum = 0;
	for(var childStr in node.child){
		if(childStr != 'END'){
			tranSortArr.push({"name":childStr,"num":node.child[childStr].num});
			totalChildNum += node.child[childStr].num;
			if(treeScale.nodeIndArr[node.child[childStr].id].cy < minChildCY){
				minChildId = node.child[childStr].id;
				minChildCY = treeScale.nodeIndArr[node.child[childStr].id].cy;
			}
		}
		else{
			endNum = node.child[childStr].num;
		}
	}
	var edgeX = 0;
	var edgeY = 0;
	// draw a part of the bottom edge
	if (totalChildNum != 0 && node.tag != "root"){
		edgeX = cx;
		edgeY = cy + cr + (minChildCY - treeScale.crScale(treeScale.nodeIndArr[minChildId].num) - cy - cr) * 0.2;
		svg.append("line").attr("x1",edgeX)
						.attr("y1",cy + cr)
						.attr("x2",edgeX)
						.attr("y2",edgeY)
						.attr("id",node.id+"-btmedge")
						.style("stroke",svgAttr.colors.edge)
						.style("stroke-width",treeScale.edgeWidthScale(node.num - endNum));
	}
	tranSortArr.sort(tranSort);
	
	//iterate through the children
	var curLeft = left;
	var curDist = right-left;
	for(var ind in tranSortArr){
		childStr = tranSortArr[ind].name;
		var distRate = ((node.child[childStr].maxWidth / node.maxWidth) + (node.child[childStr].num / totalChildNum)) / 2;
		var dist = curDist * distRate;
		//draw the tree of son
		drawTree(edgeX,edgeY,node.child[childStr],curLeft,curLeft+dist,treeScale,svg,svgAttr);
		curLeft = curLeft+dist;
	}
	// draw the node
	if(node.tag != 'root'){
		drawNode(node,cx,cy,cr,svg,svgAttr);
	}
}


//draw the axis of the workflow view
function drawAxis(d,svg,startX,startY,title=false){
var scaleSize = 8;
var g = svg.append("g")
	  .attr("class","axis")
	  .attr("transform","translate("+startX+","+startY+")");	
	for(var i in d){
		g.append("line")
		.attr("y1",d[i].scale)
		.attr("x2",scaleSize)
		.attr("y2",d[i].scale);
		g.append("text")
		.attr("y",d[i].scale)
		.attr("x",scaleSize+2)
		.attr("dy",".4em")
		.style("text-anchor", "left")
		.text(d[i].text);
	}
	g.append("line")
		.attr("x1",0)
		.attr("y1",d[0].scale)
		.attr("x2",0)
		.attr("y2",d[d.length-1].scale);
	//draw the title of the axis
	if(title != false){
		g.append("text")
			.attr("x",-5)
			.attr("y",d[0].scale-5)
			.style("font-size","14px")
			.text(title);
	}
}

function drawWorkFlow(d,svgAttr,svgId){
	var svg = d3.select(svgId)  
    .append("svg")     
    .attr("width", svgAttr.width)
    .attr("height", svgAttr.height);
	
	var r = parseTree(d);
	
	searchWidth(r);
	
	var scale = buildScale(svgAttr,r);
	
	drawTree(0,0,r,svgAttr.paddingH + svgAttr.axisWidth,svgAttr.width - svgAttr.paddingH,scale,svg,svgAttr);
	
	drawAxis(scale.axisD,svg,svgAttr.axisWidth,0,"Time");
	
	var activeArr = new Array();
	var lastSelNodeId;
	function recoverChildren(){
		while(activeArr.length != 0){
			var id = activeArr.shift();
			$("#"+id+"-cir")
				.attr("stroke",svgAttr.colors.nodeBorder);
			$("#"+id+"-cir")
				.css("cursor","default");
			$("#"+id+"-cirtxt")
				.css("cursor","default");
		}	
	}
	function activeChildren(nodeId){
		//turn its child to active node
		for(var i in scale.nodeIndArr[nodeId].child){
			var childId = scale.nodeIndArr[nodeId].child[i];
			activeArr.push(childId);
			$("#"+childId+"-cir")
				.attr("stroke",svgAttr.colors.activeBorder);
			$("#"+childId+"-cir")
				.css("cursor","pointer");
			$("#"+childId+"-cirtxt")
				.css("cursor","pointer");
			}
	}
	function recoverTree(){
		for(var id = 1; id < scale.nodeIndArr.length; id++){
			$("#"+id+"-cir")
				.attr("stroke",svgAttr.colors.nodeBorder);
			$("#"+id+"-cir")
				.css("cursor","default");
			$("#"+id+"-cirtxt")
				.css("cursor","default");
			$("#"+id+"-btmedge")
				.css("stroke",svgAttr.colors.edge);
			$("#"+id+"-uppath")
				.css("stroke",svgAttr.colors.edge);
			$("#"+id+"-upline")
				.css("stroke",svgAttr.colors.edge);				
		}
		activeArr = new Array();
	}
	$(".nodeTrigger").mousedown(function(event){
		if(event.button==0){
			var nodeId = parseInt($(this).attr("id"));
			if($.inArray(nodeId, activeArr) < 0){
				return;
			}
			//turn the active node color back to normal
			recoverChildren();
			//turn this node to the selected color
			lastSelNodeId = nodeId;
			$("#"+lastSelNodeId+"-cir")
				.attr("stroke",svgAttr.colors.selectedBorder);
			if(scale.nodeIndArr[nodeId].parentId != 0){
				$("#"+scale.nodeIndArr[nodeId].parentId+"-btmedge")
					.css("stroke",svgAttr.colors.selectedBorder);
				$("#"+nodeId+"-uppath")
					.css("stroke",svgAttr.colors.selectedBorder);
				$("#"+nodeId+"-upline")
					.css("stroke",svgAttr.colors.selectedBorder);
			}
			//turn its child to active node
			activeChildren(lastSelNodeId);
		}
		else if(event.button==2 && lastSelNodeId == parseInt($(this).attr("id"))){
			//turn the active node color back to normal
			recoverChildren();
			//turn this node to the selected color
			var nodeId = parseInt($(this).attr("id"));
			lastSelNodeId = scale.nodeIndArr[nodeId].parentId;
			if(scale.nodeIndArr[nodeId].parentId != 0){
				$("#"+scale.nodeIndArr[nodeId].parentId+"-btmedge")
					.css("stroke",svgAttr.colors.edge);
				$("#"+nodeId+"-uppath")
					.css("stroke",svgAttr.colors.edge);
				$("#"+nodeId+"-upline")
					.css("stroke",svgAttr.colors.edge);
			}
			//turn its child to active node
			activeChildren(lastSelNodeId);
		}
	});
	
	$("#wf-sel").click(function(){
		activeChildren(0);
	});
	$("#wf-cancel").click(function(){
		recoverTree();
	});
}


