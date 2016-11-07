# -*- coding:utf-8 -*-
from settings import *
from flask import session
import time

def selectorsInit(db):
    selInfo = {}
    
    cursor = conDB()
    if cursor == None:
        return None
    
    # fetch product
    sql = "SELECT DISTINCT(product) FROM " + TD[session["DS"]]["statustran"] + " ORDER BY `product`"
    cursor.execute(sql)
    products = cursor.fetchall()
    productInfo = ["All",]
    productInfo.extend([x[0].encode('utf-8').decode('utf-8') for x in products if x[0] != ""])
    selInfo["products"] = productInfo
    
    # in Mozilla we have to add component
    if session["DS"] == "mozilla":
        sql = "SELECT DISTINCT(component) FROM " + TD[session["DS"]]["statustran"] + " ORDER BY `component`"
        cursor.execute(sql)
        components = cursor.fetchall()
        compInfo = ["All",]
        compInfo.extend([x[0].encode('utf-8').decode('utf-8') for x in components if x[0] != ""])
        selInfo["components"] = compInfo
        
    # fetch resolution
    sql = "SELECT DISTINCT(resolution) FROM " + TD[session["DS"]]["statustran"]
    cursor.execute(sql)
    resolution = cursor.fetchall()
    resInfo = ["All",]
    resInfo.extend([x[0] for x in resolution if x[0] != ""])
    selInfo["resolutions"] = resInfo
    
    # fetch severity
    sql = "SELECT DISTINCT(bug_severity) FROM " + TD[session["DS"]]["statustran"]
    cursor.execute(sql)
    severity = cursor.fetchall()
    sevInfo = ["All",]
    sevInfo.extend([x[0] for x in severity if x[0] != ""])
    selInfo["severities"] = sevInfo
    
    # fetch priority
    sql = "SELECT DISTINCT(priority) FROM " + TD[session["DS"]]["statustran"]
    cursor.execute(sql)
    priority = cursor.fetchall()
    priorInfo = ["All","Tagged"]
    priorInfo.extend([x[0] for x in priority if x[0] != ""])
    selInfo["priorities"] = priorInfo
    
    # status
    rawArr = ("UNCONFIRMED","NEW","ASSIGNED","REOPENED","RESOLVED","VERIFIED","NEEDINFO")
    statusInfo = []
    statusNum = len(rawArr)
    for i in range(0,statusNum,2):
        if i + 1 < statusNum:
            statusInfo.append([rawArr[i],rawArr[i+1]])
        else:
            statusInfo.append([rawArr[i],None])
    selInfo["statusInfo"] = statusInfo
    
    # mindate,maxdate
    sql = """
    SELECT DATE_FORMAT(MIN(ts0),"%Y-%m-%d"),DATE_FORMAT(MAX(ts0),"%Y-%m-%d"),DATE_FORMAT(MIN(resolve_time),"%Y-%m-%d"),DATE_FORMAT(MAX(resolve_time),"%Y-%m-%d") FROM 
    """
    sql += TD[session["DS"]]["statustran"]
    cursor.execute(sql)
    rawD = cursor.fetchall()[0]
    dateRange = {"createRange":[rawD[0],rawD[1]],"resolveRange":[rawD[2],rawD[3]]}
    selInfo["dateRange"] = dateRange
    
    return selInfo


# get the data from selectors, first try session, if not cached then try database    
def getSelectors(db):
    
    selInfo = selectorsInit(db)
    # session[db]["selInfo"] = selInfo
    return selInfo
        
        
def fetchTimeTotal(selectors):
    
    sql = "SELECT DATE_FORMAT(ts0,'%Y-%m'),COUNT(*) FROM " + TD[session["DS"]]["statustran"]
    conSql = " WHERE "
    hasKey = False
    keys = ("bug_severity","priority","product","resolution")
    for key in keys:
        if key in selectors:
            if selectors[key] == "All": 
                continue
            hasKey = True
            conSql += key + " = '" + selectors[key] + "' AND "
    
    if hasKey:
        sql += conSql[:-4]
    
    sql += """ 
        GROUP BY DATE_FORMAT(ts0,"%Y-%m")
    """
    
    cursor = conDB()
    cursor.execute(sql)
    totalNum = cursor.fetchall()
    totalData = [[time.mktime(time.strptime(x[0]+"-01",'%Y-%m-%d')) * 1000,x[1]] for x in totalNum]
    
    return totalData
        
    
    
    
    