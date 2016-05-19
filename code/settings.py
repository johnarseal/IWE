import MySQLdb

def conDB(dbName):   
    DATABASE = {"mozilla":"iwe"}
    db = MySQLdb.connect("localhost","root","9182736450",DATABASE[dbName])
    cursor = db.cursor()
    return cursor
