from settings import *
from flask import session
import time

def fetchttWF(selectors):
    
    cursor = conDB(session["curDb"])

    sql = """
        SELECT DATE_FORMAT(ts0,"%Y-%m-%d"),COUNT(*) FROM iwe_statustran
    """
    conSql = " WHERE "
    hasKey = False
    keys = ("bug_severity","priority","product","resolution","transition")
    
    for key in keys:
        if key in selectors:
            if selectors[key] == "All": 
                continue
            elif key == "transition":
                conSql += "transition LIKE '" + selectors[key] + "%' AND "
            else:
                conSql += key + " = '" + selectors[key] + "' AND "
            hasKey = True
            
    if hasKey:
        sql += conSql[:-4]
    
    sql += """ 
        GROUP BY DATE_FORMAT(ts0,"%Y-%m-%d")
    """

    cursor.execute(sql)
    
    totalNum = cursor.fetchall()
    totalData = [[time.mktime(time.strptime(x[0],'%Y-%m-%d')) * 1000,x[1]] for x in totalNum]
    
    return totalData    
    

def fetchttResRate(selectors):

    cursor = conDB(session["curDb"])
    
    conSql = " WHERE "
    gbSQL = " GROUP BY DATE_FORMAT(ts0,'%Y-%m-%d')"
    hasKey = False
    keys = ("bug_severity","priority","product","transition")
    for key in keys:
        if key in selectors:
            if selectors[key] == "All": 
                continue
            elif key == "transition":
                conSql += "transition LIKE '" + selectors[key] + "%' AND "
            else:
                conSql += key + " = '" + selectors[key] + "' AND "
            hasKey = True
    
    # fetch the total data
    sql = """
    SELECT UNIX_TIMESTAMP(DATE_FORMAT(ts0,"%Y-%m-%d")),COUNT(*) FROM iwe_statustran 
    """        
    if hasKey:
        sql += conSql[:-4]
    sql += gbSQL
    cursor.execute(sql)
    totalD = list(cursor.fetchall())
    
    # fetch the fix data
    sql = """
    SELECT UNIX_TIMESTAMP(DATE_FORMAT(ts0,"%Y-%m-%d")),COUNT(*) FROM iwe_statustran 
    """
    if hasKey:
        sql += conSql
        sql += " resolution = 'FIXED'"
    else:
        sql += " WHERE resolution = 'FIXED' "
    sql += gbSQL
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
    
    conSql = " WHERE "
    hasKey = False
    keys = ("bug_severity","priority","product","resolution","transition")
    for key in keys:
        if key in selectors:
            if selectors[key] == "All": 
                continue
            elif key == "transition":
                conSql += "transition LIKE '" + selectors[key] + "%' AND "
            else:
                conSql += key + " = '" + selectors[key] + "' AND "
            hasKey = True
    
    # fetch the data
    sql = """
    SELECT UNIX_TIMESTAMP(DATE_FORMAT(ts0,"%Y-%m-%d")),UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP(ts0) FROM iwe_statustran 
    """        

    sql += conSql + " resolve_time IS NOT NULL"
    cursor.execute(sql)
    rawD = list(cursor.fetchall())
    rawDict = {}
    divisor = 24 * 3600
    for row in rawD:
        if row[0] not in rawDict:
            days = row[1] / divisor
            rawDict[row[0]] = [days]
        else:
            rawDict[row[0]].append(days)
            
    retD = []
    for ts in rawDict:
        tsNum = len(rawDict[ts])
        retD.append([ts*1000,rawDict[ts][int(tsNum*0.9)]])
    retD.sort(lambda x,y:cmp(x[0],y[0]))
    
    return retD








    
    