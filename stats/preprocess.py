# preprocessing the raw data of bugzilla to build the dataset used by IWE

# below are the basic settings of your database

RAW_HOST = 'localhost'
RAW_USER = 'root'
RAW_PASS = '9182736450'
RAW_NAME = 'mozilla'
NEW_TBNAME = RAW_NAME + "_statusTran"


import MySQLdb
# connecting database
conn = MySQLdb.connect(host=RAW_HOST,user=RAW_USER,passwd=RAW_PASS,db=RAW_NAME)
cur = conn.cursor()

# First, filter status transition activity out of bugs_activity
cur.execute('SELECT * FROM bugs_activity WHERE fieldid=29 ORDER BY bug_id, bug_when;')
print "Successfully fetch all the raw data"
sortedTran = cur.fetchall()
recDict = {}
problemList = []
tableDict = {}
lenDict = {}
tranDict = {}
curProblem = -1
tranStr = None
lastId = None
for item in sortedTran:
    if item[0] == curProblem:
        continue
    # encounter a new bug
    if item[0] not in recDict:
        # for last bug
        if tranStr:
            tableDict[lastId]={"transition":tranStr,"timeStamp":timeList}
        lastId = item[0]
        recDict[item[0]] = 1
        tranStr = item[4] + " " + item[5]
        timeList = [item[2],]
    # a problem bug
    elif item[4] == "" or item[4] != added:
        problemList.append(item[0])
        curProblem = item[0]
        tranStr = None
    # the following transition
    else:
        tranStr += " " + item[5]
        timeList.append(item[2])
    added = item[5]

    
# check whether the number of status equal to the length of the transition str
proList = []
for bugId in tableDict:
    tranStr = tableDict[bugId]["transition"]
    tsLen = len(tableDict[bugId]["timeStamp"])
    strArr = tranStr.split()
    if len(strArr)-1 != tsLen or tranStr[0] == " ":
        proList.append(bugId)
for bugId in proList:
    del tableDict[bugId]
    

# fetch the resolve time    
cur.execute('SELECT bug_id,MAX(bug_when) FROM bugs_activity WHERE fieldid = 30 GROUP BY bug_id')
sortedRes = cur.fetchall()
resDict = {item[0]:item[1] for item in sortedRes}


# fetch the basic information of bugs from table `bugs`
sql = """
SELECT bug_id,creation_ts,bug_severity,priority,resolution,`name`
FROM bugs LEFT JOIN iwe.products ON product_id = id
"""
cur.execute(sql)
bugsInfo = cur.fetchall()
bugsInfoDict = {bug[0]:bug for bug in bugsInfo}


# append the info of bug to the tableDict
proList = []
for bugId in tableDict:
    if bugId in bugsInfoDict:
        tableDict[bugId]["timeStamp"].insert(0,bugsInfoDict[bugId][1])
        tableDict[bugId]["bug_severity"]=bugsInfoDict[bugId][2]
        tableDict[bugId]["priority"]=bugsInfoDict[bugId][3]
        tableDict[bugId]["resolution"]=bugsInfoDict[bugId][4]
        tableDict[bugId]["product"]=bugsInfoDict[bugId][5]
        if bugId in resDict:
            tableDict[bugId]["resolve_time"]=resDict[bugId]
        else:
            tableDict[bugId]["resolve_time"]=None
    else:
        proList.append(bugId)

# delete the bug which doesn't have info in tableDict      
for bugId in proList:
    del tableDict[bugId]
    

# Up till now, we've finished the preprocessing of raw data
# Now we are ready to insert them into the new database   
    
# create database
sql = "CREATE DATABASE IF NOT EXISTS iwe DEFAULT CHARSET utf8 COLLATE utf8_general_ci;"
cur.execute(sql)
# change database
cur.execute("USE iwe")
sql = "CREATE TABLE " + NEW_TBNAME + """ (
  `pk` int unsigned AUTO_INCREMENT PRIMARY KEY,
  `bugId` int unsigned NOT NULL,
  `transition` varchar(80) NOT NULL DEFAULT '',
  `ts0` datetime NULL,
  `ts1` datetime NULL,
  `ts2` datetime NULL,
  `ts3` datetime NULL,
  `ts4` datetime NULL,
  `ts5` datetime NULL,
  `bug_severity` VARCHAR(64) NOT NULL,
  `priority` VARCHAR(64) NOT NULL,
  `resolution` VARCHAR(64) NOT NULL,
  `product` VARCHAR(64) NOT NULL,
  `resolve_time` datetime NULL
);
"""
# create table
cur.execute(sql)

print "Start to insert data"
# insert data into the new table
for bugId in tableDict:
    if len(tableDict[bugId]["timeStamp"]) > 6:
        continue
    sql = "INSERT INTO " + NEW_TBNAME + " (bugId, transition"
    for i in range(len(tableDict[bugId]["timeStamp"])):
        sql += ", ts" + str(i)
    infoKeys = ("bug_severity","priority","resolution","product","resolve_time")
    for key in infoKeys:
        sql += ", " + key
    sql += ") VALUES(" + str(bugId) + ", '" + tableDict[bugId]["transition"] + "'"
    for ts in tableDict[bugId]["timeStamp"]:
        sql += ", '" + str(ts) + "'"
    for key in infoKeys:
        if tableDict[bugId][key] != None:
            sql += ", '" + str(tableDict[bugId][key]) + "'"
        else:
            sql += ", NULL"
    sql += ");"
    cur.execute(sql)

print "Insert success!"    
cur.close()
conn.commit()




