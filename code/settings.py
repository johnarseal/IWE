import MySQLdb

def conDB():   
    db = MySQLdb.connect("localhost","root","9182736450","iwe")
    cursor = db.cursor()
    return cursor

# table dict
TD = {"mozilla":{"statustran":"mozilla_statustran","products":"mozilla_products"},"gnome":{"statustran":"gnome_statustran","products":"gnome_products"}}
