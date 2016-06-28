from settings import *
from flask import session
import time
from sqlconstruct import *

def fetchttWF(selectors):

    thistime = "ts0"
    if session["tmtp"] == "rslt":
        thistime = "resolve_time"   

    cursor = conDB()

    sql = "SELECT DATE_FORMAT("+thistime+",'%Y-%m-%d'),COUNT(*) FROM " + TD[session["DS"]]["statustran"]
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql
        if thistime == "resolve_time":
            sql += " AND resolve_time IS NOT NULL"
    else:
        if thistime == "resolve_time":
            sql += " WHERE resolve_time IS NOT NULL" 
    sql += " GROUP BY DATE_FORMAT("+thistime+",'%Y-%m-%d')"
    print "hey hehe " + sql
    cursor.execute(sql)
    
    totalNum = cursor.fetchall()
    totalData = [[time.mktime(time.strptime(x[0],'%Y-%m-%d')) * 1000,x[1]] for x in totalNum]
    
    return totalData    
    

def fetchttResRate(selectors):

    thistime = "ts0"
    if session["tmtp"] == "rslt":
        thistime = "resolve_time"   

    cursor = conDB()
    gbSQL = " GROUP BY DATE_FORMAT("+thistime+",'%Y-%m-%d')"
    # fetch the total data
    sql = "SELECT UNIX_TIMESTAMP(DATE_FORMAT("+thistime+",'%Y-%m-%d')),COUNT(*) FROM " + TD[session["DS"]]["statustran"]   
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql
        if thistime == "resolve_time":
            sql += " AND resolve_time IS NOT NULL"
    else:
        if thistime == "resolve_time":
            sql += " WHERE resolve_time IS NOT NULL"     
    sql += gbSQL
    cursor.execute(sql)
    totalD = list(cursor.fetchall())
    
    # fetch the fix data
    sql = "SELECT UNIX_TIMESTAMP(DATE_FORMAT("+thistime+",'%Y-%m-%d')),COUNT(*) FROM " + TD[session["DS"]]["statustran"]
    if conSql != None:
        sql += conSql    
        sql += " AND resolution = 'FIXED'"
        if thistime == "resolve_time":
            sql += " ADN resolve_time IS NOT NULL"
    else:
        sql += " WHERE resolution = 'FIXED'"
        if thistime == "resolve_time":
            sql += " AND resolve_time IS NOT NULL"   
    sql += gbSQL
    print sql
    cursor.execute(sql)
    fixD = list(cursor.fetchall())
    
    totalDict = {x[0]:x[1] for x in totalD}
    fixDict = {x[0]:x[1] for x in fixD}
    rateDict = {}
    for d in fixDict:
        rateDict[d] = float(fixDict[d]) / totalDict[d]
        
    retD = [[x*1000,rateDict[x]] for x in rateDict]
    retD.sort(lambda x,y:cmp(x[0],y[0]))
    
    return retD

    
def fetchttResTime(selectors):

    thistime = "ts0"
    if session["tmtp"] == "rslt":
        thistime = "resolve_time"   

    cursor = conDB()
    
    # fetch the data
    sql = "SELECT UNIX_TIMESTAMP(DATE_FORMAT("+thistime+",'%Y-%m-%d')),UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP(ts0) FROM " + TD[session["DS"]]["statustran"]
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql + " AND resolve_time IS NOT NULL"
    else:
        sql += " WHERE resolve_time IS NOT NULL"
    sql += " ORDER BY UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP("+thistime+")"
    cursor.execute(sql)
    rawD = list(cursor.fetchall())
    rawDict = {}
    divisor = 24 * 3600
    for row in rawD:
        days = row[1] / divisor
        if row[0] not in rawDict:
            rawDict[row[0]] = [days]
        else:
            rawDict[row[0]].append(days)

            
    retD = []
    for ts in rawDict:
        tsNum = len(rawDict[ts])
        retD.append([ts*1000,rawDict[ts][int(tsNum*0.9)]])
    retD.sort(lambda x,y:cmp(x[0],y[0]))
    
    return retD








    
    