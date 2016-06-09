from settings import *
from flask import session
import time
from sqlconstruct import *

def fetchResRate(selectors):
    
    sql = "SELECT resolution, COUNT(*) FROM " + TD[session["DS"]]["statustran"]
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql        
    sql += " GROUP BY resolution"
    cursor = conDB()
    cursor.execute(sql)
    rawD = list(cursor.fetchall())
    retD = []
    for row in rawD:
        if row[0] == "":
            retD.append(("NONE",row[1]))
        else:
            retD.append(row)
    
    return retD     
                   
def fetchResTime(selectors):

    sql = "SELECT UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP(ts0) FROM " + TD[session["DS"]]["statustran"]
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql    
    sql += " ORDER BY UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP(ts0)"
    cursor = conDB()
    cursor.execute(sql)    
    rawList = list(cursor.fetchall())
    resTimeList = [x[0] for x in rawList if x[0] != None]
    numTotal = len(rawList)
    numRes = len(resTimeList)
    retList = [[0,0]]
    timeQuant = [0.5,0.6,0.7,0.8,0.9]
    divisor = 3600 * 24
    for tq in timeQuant:
        curInd = int(numTotal * tq)
        if curInd > numRes:
            retList.append([round(float(resTimeList[numRes-1])/divisor,2),round(float(numRes) / numTotal,2)])
            break
        retList.append([round(float(resTimeList[curInd - 1])/divisor,2),tq])

    return retList    