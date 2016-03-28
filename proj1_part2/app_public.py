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
app.config['DEBUG'] = False

# url_for('static', filename='style.css')
# url_for('static', filename='style.css')
# url_for('static', filename='style.css')
try:
	conn = psycopg2.connect("dbname='lsde' user='keying' host='128.59.17.200' password='dvmm32123'")
	# ////psql -h 128.59.17.200 -U keying -d lsde

	conn.autocommit= True
except Exception, e:
	print e, "Connection Unsucessful"
cur = conn.cursor()


"""
app.add_url_rule('/favicon.ico', redirect_to=url_for('static', filename='favicon.ico')) #url_for not defined
"""

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
	#return render_template("index.html")
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
	#datetime.strptime("2015-12-07 00:01:02", "%Y-%m-%d %H:%M:%S") #this should be put to the frontend
	qry = "SELECT content from images WHERE camname=\'" +str(camname)+ "\' and time> \'"+ str(starttime) +"\' and time < \'"+ str(endtime)+"\';"
	print qry
	try:
		cur.execute(qry)
	except Exception,e:
		print e
		return "cannot find image"
	#print args
	row = cur.fetchone()
	#print type(row)
	#print row
	try:
		bindata = base64.b64encode(row[0]).decode('utf-8')
	except Exception, e:
		print e
		return "error using base64"
	print "returning bindata"
	return bindata
@app.route("/alerts")
def alerts():
	args = request.args
#	istype = args.get('istype')
	typename = args.get('typename')
	startD = args.get('startD')
	endD = args.get('endD')
	startT = args.get('startT')
	endT = args.get('endT')
	# startD = start[0:9]
	# endD = end[0:9]
	# startT = start[11:]
	# endT = end[11:]

	# print 'start '+start
	# print 'end '+end
	print 'startD '+startD
	print 'endD '+endD
	print 'startT '+startT
	print 'endT '+endT
	#select '12/7/2015, 12:00:00 PM'-date_trunc('day', timestamp '12/7/2015, 12:00:00 PM') as timeonly;
#	if istype == 'true':

	try:
		cur.execute("SELECT location_lat, location_long from alerts WHERE type= %s \
					 AND time::date BETWEEN %s and %s \
					 AND time::time BETWEEN %s and %s;" 
					 , [typename, startD, endD, startT, endT])

	except Exception,e:
		print e
		return "cannot find alerts"
	
	row = cur.fetchall()
#		print "type of row: "+ str(type(row)) + "type of row[0]" + str(type(row[0])) + "type of row[0][0]" + str(type(row[0][0]))
#		pprint(row)
	return jsonify(coords = row)
	#json.dumps(row)
	
	# "type: "+istype + ' typename: '+typename

	# qry =	"SELECT location_lat,location_long from alerts WHERE type=\'" +str(typename)+ "\' and date_trunc('day', timestamp time)> \'"+ str(startD) +"\' and date_trunc('day', timestamp time) < \'"+ str(endD)+"\';"
	#try 
	#"SELECT time from alerts WHERE type=\'" +str(typename)+ "\' and date_trunc('day', timestamp time)> \'12/7/2015\' and date_trunc('day', timestamp time) < \'12/8/2015\';"
	# SELECT time from alerts A WHERE type='hazard' and date_trunc('day', timestamp A.time) > '12/7/2015' and date_trunc('day', timestamp A.time) < '12/8/2015';
@app.route('/wordCloud',methods=['POST'])
def wordCloud():
	data = json.loads(request.form['coord'])
	sT= request.form['startTime']
	sD = request.form['startDate']
	eT = request.form['endTime']
	eD = request.form['endDate']
	qry ="SELECT content from tweets WHERE (lat BETWEEN "+ str(data[3]['lat']) +" and "+ str(data[1]['lat']) +");"

	try:
		cur.execute(qry)
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
	wordcloud = WordCloud(max_font_size=40, relative_scaling=.5).generate(data)
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





