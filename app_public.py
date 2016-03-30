from flask import Flask, render_template, request, url_for, jsonify
import psycopg2
import base64
from datetime import timedelta
from datetime import datetime
from pprint import pprint
import json
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import re

app = Flask(__name__)
app.config['DEBUG'] = True

try:
	conn = psycopg2.connect("dbname='sm4083' user='sm4083' host='w4111db.eastus.cloudapp.azure.com' password='RPTDAA'")
	# ////psql -h 128.59.17.200 -U keying -d lsde

try:
	conn = psycopg2.connect("dbname='sm4083' user='sm4083' host='w4111db.eastus.cloudapp.azure.com' password='RPTDAA'")
	conn.autocommit= True
except Exception, e:
	print e, "Connection Unsucessful"
cur = conn.cursor()


@app.route('/',methods=["GET","POST"])
def homepage():
	if request.method == 'GET':
		try:
			cur.execute("select distinct name,location_lat,location_long from camera as C, images as I where C.name = I.camname")
		except Exception,e:
			print e
	data = cur.fetchall()
	print data[0]
	return render_template("index.html", cam_data = json.dumps(data))
	
@app.route("/about.html")
def about():
	return render_template("about.html")

@app.route("/blog.html")
def blog():
	return render_template("blog.html")

@app.route("/contact.html")
def contact():
	return render_template("contact.html")

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


	print ("%s, %s, %s, %s" %(data[3]['lat'], data[1]['lat'], data[3]['lng'], data[1]['lng']))
	print ("%s, %s, %s, %s" %(sD, eD, sT, eT))


	print 'hello'
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



if __name__ == "__main__":	
	app.run(host='0.0.0.0')

# return jsonify({ 
#         'text': microsoft_translate(
#             request.form['text'], 
#             request.form['sourceLang'], 
#             request.form['destLang']) })
#cur.close()
#conn.close()


# import json
# return json.dumps(list))





