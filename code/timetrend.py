from settings import *
from flask import session
import time
from sqlconstruct import *

def fetchttWF(selectors):
    
    cursor = conDB(session["curDb"])

    sql = """
        SELECT DATE_FORMAT(ts0,"%Y-%m-%d"),COUNT(*) FROM iwe_statustran
    """
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql   
    sql += """ 
        GROUP BY DATE_FORMAT(ts0,"%Y-%m-%d")
    """

    cursor.execute(sql)
    
    totalNum = cursor.fetchall()
    totalData = [[time.mktime(time.strptime(x[0],'%Y-%m-%d')) * 1000,x[1]] for x in totalNum]
    
    return totalData    
    

def fetchttResRate(selectors):

    cursor = conDB(session["curDb"])
    gbSQL = " GROUP BY DATE_FORMAT(ts0,'%Y-%m-%d')"
    # fetch the total data
    sql = """
    SELECT UNIX_TIMESTAMP(DATE_FORMAT(ts0,"%Y-%m-%d")),COUNT(*) FROM iwe_statustran 
    """        
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql    
    sql += gbSQL
    cursor.execute(sql)
    totalD = list(cursor.fetchall())
    
    # fetch the fix data
    sql = """
    SELECT UNIX_TIMESTAMP(DATE_FORMAT(ts0,"%Y-%m-%d")),COUNT(*) FROM iwe_statustran 
    """
    if conSql != None:
        sql += conSql    
        sql += " AND resolution = 'FIXED'"
    else:
        sql += " WHERE resolution = 'FIXED' "
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

    cursor = conDB(session["curDb"])
    
    # fetch the data
    sql = """
    SELECT UNIX_TIMESTAMP(DATE_FORMAT(ts0,"%Y-%m-%d")),UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP(ts0) FROM iwe_statustran 
    """        
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql + " AND resolve_time IS NOT NULL"
    else:
        sql += " WHERE resolve_time IS NOT NULL"
    sql += " ORDER BY UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP(ts0)"
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








    
    