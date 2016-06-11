import MySQLdb

def conDB():   
    db = MySQLdb.connect("localhost","root","9182736450","iwe")
    cursor = db.cursor()
    return cursor

sql = "SELECT bugId,transition,ts0,ts1,ts2,ts3,ts4,ts5 FROM gnome_statustran"
cursor = conDB()
cursor.execute(sql)
rawD = list(cursor.fetchall())
errorArr = []
for row in rawD:
    tranArr = row[1].split(" ")
    tsNum = 0
    for i in range(2,8):
        if row[i] != None:
            tsNum += 1
    if len(tranArr) != tsNum:
        print row[0]
        errorArr.append(row[0])
        
print "total dirty num: " + str(len(errorArr))