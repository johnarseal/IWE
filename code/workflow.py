from settings import *
import time
from flask import session
from sqlconstruct import *

sqlTS = """
UNIX_TIMESTAMP(ts1) - UNIX_TIMESTAMP(ts0),
UNIX_TIMESTAMP(ts2) - UNIX_TIMESTAMP(ts1),
UNIX_TIMESTAMP(ts3) - UNIX_TIMESTAMP(ts2),
UNIX_TIMESTAMP(ts4)- UNIX_TIMESTAMP(ts3),
UNIX_TIMESTAMP(ts5)- UNIX_TIMESTAMP(ts4) 
"""
def processWFdata(rawD):
    data = list(rawD)
    
    # do the group by to prepare the rawDict
    rawDict = {}
    for row in data:
        if row[0] not in rawDict:
            rawDict[row[0]] = [[],[],[],[],[]]
        for i in range(1,6):
            rawDict[row[0]][i-1].append(row[i])
     
    # get the size of different transition
    totalNum = len(data)
    sizeList = []
    for tranStr in rawDict:
        sizeList.append([tranStr,len(rawDict[tranStr][0])])
    sizeList.sort(lambda x,y:cmp(y[1],x[1]))
    
    # prepare the return data
    rtData = {}
    curNum = 0
    curStr = 0
        
    # figure out the measurement
       
    divisor = 3600*24
    for tran,num in sizeList:
        tsNum = len(tran.split(" ")) - 1
        meanArr = [0,]
        q1Arr = [0,]
        q2Arr = [0,]
        q3Arr = [0,]
        tmpSize = len(rawDict[tran][0])
        for i in range(tsNum):
            rawDict[tran][i].sort()
            meanArr.append(sum(rawDict[tran][i]) / (float(tmpSize) * divisor))
            q1Arr.append(rawDict[tran][i][int(tmpSize * 0.25)] / float(divisor))
            q2Arr.append(rawDict[tran][i][int(tmpSize * 0.5)] / float(divisor))
            q3Arr.append(rawDict[tran][i][int(tmpSize * 0.75)] / float(divisor))
        rtData[tran] = {"num":tmpSize,"ts":q2Arr,"meanTS":meanArr,"q1":q1Arr,"q3":q3Arr}
        curNum += tmpSize
        curStr += 1
        if curNum > totalNum * 0.9:
            break
        if curStr >= 15:
            break    

    return rtData

    
def workflowInit(db):
    cursor = conDB(db)
    if cursor == None:
        return None
        
    # fetch the data from db and transform it into list
    sql = "SELECT transition, " + sqlTS + " FROM iwe_statustran"
    cursor.execute(sql)
    rawD = cursor.fetchall()
    rtData = processWFdata(rawD)
    
    return rtData
    

# get the data from selectors, first try session, if not cached then try database    
def getWorkflow(db):
        
    workflowD = workflowInit(db)
    return workflowD
    
def fetchWorkflow(selectors):
    
    sql = "SELECT transition, " + sqlTS + " FROM iwe_statustran "
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql
    cursor = conDB(session["curDb"])
    cursor.execute(sql)
    rawD = cursor.fetchall()
    if len(rawD) == 0:
        return None
    else:
        return processWFdata(rawD)
    
    