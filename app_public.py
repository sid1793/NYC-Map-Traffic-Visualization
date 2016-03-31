from flask import Flask, render_template, request, url_for, jsonify,Response
import psycopg2
import base64
from datetime import timedelta
from datetime import datetime
from pprint import pprint
import json
from wordcloud import WordCloud
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import re
import random

app = Flask(__name__)
app.config['DEBUG'] = True


try:
	conn = psycopg2.connect("dbname='az2407' user='az2407' host='w4111db.eastus.cloudapp.azure.com' password='LXSZEJ'")
	conn.autocommit= True
except Exception, e:
	print e, "Connection Unsucessful"
cur = conn.cursor()


@app.route('/',methods=["GET","POST"])
def homepage():
	return render_template("index.html")
	
@app.route("/about.html")
def about():
	return render_template("about.html")

@app.route("/blog.html")
def blog():
	return render_template("blog.html")

@app.route("/contact.html")
def contact():
	return render_template("contact.html")

@app.route("/camcoords")
def camcoords():
	try:
		cur.execute("select distinct name,location_lat,location_long from camera as C, images as I where C.name = I.camname")
	except Exception,e:
		print e
	data = cur.fetchall()
	print data[0]
	return jsonify(coords = data)

@app.route("/alltweets")
def alltweets():
	try:
		cur.execute("select time from tweets")
	except Exception,e:
		print e
	data = cur.fetchall()
	print data[0]
	rand_smpl = [ data[i] for i in sorted(random.sample(xrange(len(data)), 1000)) ]
	return jsonify(tweets = rand_smpl)

@app.route("/images")
def images():
	args = request.args
	starttime = args.get('starttime')
	endtime = args.get('endtime')
	camname = args.get('camname')
	querystring = request.query_string
	qry = "SELECT content from images WHERE camname=\'" +str(camname)+ "\' and time> \'"+ str(starttime) +"\' and time < \'"+ str(endtime)+"\';"
	
	try:
		cur.execute(qry)
	except Exception,e:
		print e
		return "cannot find image"
	
	row = cur.fetchone()
	try:
		bindata = base64.b64encode(row[0]).decode('utf-8')
	except Exception, e:
		print e
		return "error using base64"
	return bindata
@app.route("/alerts")
def alerts():
	args = request.args
	typename = args.get('typename')
	startD = args.get('startD')
	endD = args.get('endD')
	startT = args.get('startT')
	endT = args.get('endT')
	
	try:
		cur.execute("SELECT location_lat, location_long from alerts WHERE type= %s \
					 AND time::date BETWEEN %s and %s \
					 AND time::time BETWEEN %s and %s;" 
					 , [typename, startD, endD, startT, endT])

	except Exception,e:
		print e
		return "cannot find alerts"
	
	row = cur.fetchall()
	return jsonify(coords = row)

@app.route('/wordCloud',methods=['POST'])
def wordCloud():

	data = json.loads(request.form['coord'])

	sT= request.form['startTime']
	sD = request.form['startDate']
	eT = request.form['endTime']
	eD = request.form['endDate']

	try:
		cur.execute("SELECT content from tweets WHERE \
					 	 lat BETWEEN %s and %s		  \
					 AND long BETWEEN %s and %s		  \
					 AND time::date BETWEEN %s and %s \
					 AND time::time BETWEEN %s and %s;" 
					 , [data[3]['lat'], data[1]['lat'], data[1]['lng'], data[3]['lng'], sD, eD, sT, eT])
	except Exception,e:
		print e
	row = cur.fetchall()
	data = ''
	for ele in row:
		tweet = str(ele)
		for word in tweet.split():
			word=word.strip('(')
			word = re.sub(r'[^\w]', '',word.strip(',)'))
			data+=' %s' %word	
	wordcloud = WordCloud(background_color="white", max_font_size=40, relative_scaling=.5).generate(data)
	plt.imshow(wordcloud)
	plt.axis("off")
	plt.savefig('static/img/wordcloud.png')
	return 'Showing World Cloud'

@app.route("/objects",methods =['POST'])
def sendCount():
	camname = json.loads(request.form['name'])
	row = []
	for i in range(3):
		qry = "select count(*) from (select imageid from images where camname=\'"+str(camname)+"\') as I, (select imageid from detection_in where objid="+str((i+1))+") as D where I.imageid=D.imageid;" 
		try:
			cur.execute(qry)
		except Exception,e:
			print e
		row.append(int(list(cur.fetchone())[0]))
	print row
	return json.dumps(row)

@app.route("/wazeAlert",methods=['POST'])
def wazeLevel():
	level = int(json.loads(request.form['level']))
	print level
	qry = "select count(*) from tweets as T, (select location_lat, location_long, time from jams where level="+str(level)+" limit 200) as J where T.lat between J.location_lat-0.001 and J.location_lat+0.001 and T.long between J.location_long-0.001 and J.location_long+0.001 and T.time - J.time < interval '1 hour';"
	print qry
	try:
		cur.execute(qry)
	except Exception,e:
		print e
	number = int(cur.fetchone()[0])
	print number
	return jsonify(num=number)

@app.route("/event",methods=['POST'])
def createEvent():
	name = str(request.form['event_name'])
	data = json.loads(request.form['bbox'])
	sT= request.form['startTime']
	sD = request.form['startDate']
	qry = "Insert into event(name,date,time,lat1,long1,lat2,long2) values(\'%s\',\'%s\',\'%s\',%s,%s,%s,%s);" %(name,sD,sT,data[3]['lat'], data[1]['lat'], data[1]['lng'], data[3]['lng'])
	print qry
	try:
		cur.execute(qry)
	except Exception,e:
		print e
	return "inserted data"

if __name__ == "__main__":	
	app.run(host='0.0.0.0',port=8111)






