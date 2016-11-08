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

def createWfCacheTB(tbName,conn,cursor):
    initCreateSql = "CREATE TABLE " + tbName +\
    """(
        transition VARCHAR(80) NOT NULL PRIMARY KEY,
        num INT NOT NULL,
        q1t0 DOUBLE(16,8),
        q1t1 DOUBLE(16,8),
        q1t2 DOUBLE(16,8),
        q1t3 DOUBLE(16,8),
        q1t4 DOUBLE(16,8),
        q1t5 DOUBLE(16,8),
        q2t0 DOUBLE(16,8),
        q2t1 DOUBLE(16,8),
        q2t2 DOUBLE(16,8),
        q2t3 DOUBLE(16,8),
        q2t4 DOUBLE(16,8),
        q2t5 DOUBLE(16,8),
        q3t0 DOUBLE(16,8),
        q3t1 DOUBLE(16,8),
        q3t2 DOUBLE(16,8),
        q3t3 DOUBLE(16,8),
        q3t4 DOUBLE(16,8),
        q3t5 DOUBLE(16,8),
        meant0 DOUBLE(16,8),
        meant1 DOUBLE(16,8),
        meant2 DOUBLE(16,8),
        meant3 DOUBLE(16,8),
        meant4 DOUBLE(16,8),
        meant5 DOUBLE(16,8)
    );
    """
    cursor.execute(initCreateSql)
    conn.commit()


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
    
def fetchWorkflow(selectors):
    
    if len(selectors) == 0:
        return fetchInitWF()
    else:    
        sql = "SELECT transition, " + sqlTS + " FROM " + TD[session["DS"]]["statustran"]
        conSql = buildSQL(selectors)
        if conSql != None:
            sql += conSql
        cursor = conDB()
        cursor.execute(sql)
        rawD = cursor.fetchall()
        if len(rawD) == 0:
            return None
        else:
            return processWFdata(rawD)


# this is to optimize the initial time spent on fetching workflow data
def fetchInitWF():
    tbName = session["DS"] + "_wfinit_cache"
    sql = "SHOW TABLES LIKE '" + tbName + "'"
    conn = getDBCon()
    cursor = conn.cursor()
    
    # see whether the cache table exists
    
    # if not exists, build the cache table and store the cache
    if cursor.execute(sql) == 0:    
        fetchSQL = "SELECT transition, " + sqlTS + " FROM " + TD[session["DS"]]["statustran"]
        cursor.execute(fetchSQL)
        rawD = cursor.fetchall()
        if len(rawD) == 0:
            return None
        else:
            proData = processWFdata(rawD)        
        
        # create the cache table
        maxLen = 6
        createWfCacheTB(tbName,conn,cursor)
        
        # store the data in cache table
        for tranStr in proData:
            row = proData[tranStr]
            insertSql = "INSERT INTO " + tbName + " VALUES('" + tranStr + "', " + str(row["num"])
            items = ("q1","ts","q3","meanTS",)
            for item in items:
                for index in range(len(row[item])):                
                    insertSql += ", " + str(row[item][index])
                for i in range(maxLen - len(row[item])):
                    insertSql += ", NULL"
            insertSql += ")"
            cursor.execute(insertSql)
        conn.commit()

    sql = "SELECT * FROM " + tbName
    cursor.execute(sql)
    rawD = cursor.fetchall()
    rtData = {}
    for row in rawD:
        tranStr = row[0]
        rtData[tranStr] = {}
        rtData[tranStr]["num"] = row[1]
        rtData[tranStr]["q1"] = []
        rtData[tranStr]["q3"] = []
        rtData[tranStr]["ts"] = []
        rtData[tranStr]["meanTS"] = []
        for i in range(2,8):
            if(row[i]) == None:
                break
            rtData[tranStr]["q1"].append(row[i])
        for i in range(8,14):
            rtData[tranStr]["ts"].append(row[i])
        for i in range(14,20):
            rtData[tranStr]["q3"].append(row[i])
        for i in range(20,26):
            rtData[tranStr]["meanTS"].append(row[i])
    
    return rtData
    
    
    