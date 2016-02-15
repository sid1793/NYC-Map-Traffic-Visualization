from flask import Flask, render_template, request
import psycopg2
import base64

app = Flask(__name__)
app.config['DEBUG'] = True

try:
	conn = psycopg2.connect("dbname='mydb' user='Siddhesh' host='localhost' password='Mhatre1793'")
	conn.autocommit= True
except Exception, e:
	print e, "Connection Unsucessful"
cur = conn.cursor()

@app.route('/',methods=["GET","POST"])
def displayrandomImage():
	if request.method == "GET":
		try:
			cur.execute("SELECT image from images WHERE id=100")
		except Exception,e:
			print e
		row = cur.fetchone()
		bin = psycopg2.Binary(row[0])
		return render_template("test.html",bindata=base64.b64encode(bin.getquoted()))
	else :
		return "Cannot execute POST"



if __name__ == "__main__":
	app.run()