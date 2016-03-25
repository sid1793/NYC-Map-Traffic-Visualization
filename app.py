from flask import Flask, render_template, request, json
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
		# try:
		# 	cur.execute("SELECT content from images WHERE imageid=120")
		# except Exception,e:
		# 	print 'Exception caught',e
		# row = cur.fetchone()
		
		try:
			cur.execute("select distinct name,location_lat,location_long from camera as C, images as I where C.name = I.camname")
		except Exception,e:
			print e
		data = cur.fetchall()
		return render_template("index.html", cam_data = json.dumps(data))
		#return render_template("test.html",bindata=base64.b64encode(row[0]).decode('utf-8'), loc = row2)
	else :
		data = request.form['coordinates']
		camname =  str(json.loads(data))
		camname = camname[3:len(camname)-2]
		qry = "SELECT content from images where camname = \'"+camname+"\';"
		print qry
		try: 	
		  	cur.execute(qry)
		except Exception,e:
			print e
		data = cur.fetchone()
		bindata = base64.b64encode(data[0]).decode('utf-8')
		print bindata
		return bindata

if __name__ == "__main__":	
	app.run()