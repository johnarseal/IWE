import MySQLdb

def conDB():   
    db = MySQLdb.connect("localhost","root","","iwe",charset="utf8")
    cursor = db.cursor()
    return cursor

def getDBCon():   
    conn = MySQLdb.connect("localhost","root","","iwe",charset="utf8")
    return conn

# table dict
TD = {"mozilla":{"statustran":"mozilla_statustran","products":"mozilla_products"},"gnome":{"statustran":"gnome_statustran","products":"gnome_products"}}
