import MySQLdb
import time

db = MySQLdb.connect("localhost","root","9182736450","iwe")
cur = db.cursor()

cur.execute("SELECT * FROM mozilla_bugid_compid")
bugCompRaw = cur.fetchall()
bugCompDict = {}
for row in bugCompRaw:
    bugCompDict[row[0]] = row[1]

cur.execute("SELECT name,id FROM mozilla_components")
compraw = cur.fetchall()
compDict = {}
for row in compraw:
    compDict[row[1]] = row[0]

print "start to update statustran"

cur.execute("SELECT bugId FROM mozilla_statustran")
raw = cur.fetchall()
updateNum = 0
t1 = time.clock()
for row in raw:
    bugId = row[0]
    if bugId not in bugCompDict:
        print "bug id" + str(bugId) + " not found in bugCompDict"
        continue
    compId = bugCompDict[bugId]
    if compId not in compDict:
        print "comp id" + str(compId) + " not found in compDict"
        continue
    component = compDict[compId]
    sql = "UPDATE mozilla_statustran SET component = '" + str(component) + "' WHERE bugId = " + str(bugId)
    cur.execute(sql)
    updateNum += 1
    db.commit()
    if updateNum % 1000 == 0:
        t2 = time.clock()
        print "update " + str(updateNum) + " rows, time: " + str(t2)

    
    
    
    
    
    