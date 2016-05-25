from flask import session

def fff():
    if "asd" not in session:
        print "not"
    else:
        print "yes"
	session["asd"] = 1