import psycopg2
import random

fconf = open ('dbconfig.txt', 'r')
conf = fconf.read()
conn = psycopg2.connect("dbname='az2407' user='az2407' host='w4111db.eastus.cloudapp.azure.com' password='LXSZEJ'")
conn.autocommit= True
cur = conn.cursor()

try:
	cur.execute('INSERT INTO object (name) VALUES (\'car\')');
	cur.execute('INSERT INTO object (name) VALUES (\'bus\')');
	cur.execute('INSERT INTO object (name) VALUES (\'person\')');
except psycopg2.Error as e:
	print e.pgerror

conn.commit()

for idx in range (1, 10000):
	row = {}
	row ['imageid'] = idx
	row ['objid'] = random.randint(7,9)
	row ['bbox_x'] = random.randint (1, 200)
	row ['bbox_y'] = random.randint (1, 100)
	row ['bbox_w'] = random.randint (10, 50)
	row ['bbox_h'] = random.randint (10, 50)

	try:
		cur.execute('INSERT INTO detection_in (imageid, objid, bbox_x, bbox_y, bbox_w, bbox_h) VALUES (%s, %s, %s, %s, %s, %s)' % (row ['imageid'], row ['objid'], row ['bbox_x'], row ['bbox_y'], row ['bbox_w'], row ['bbox_h']));
	except psycopg2.Error as e:
		print e.pgerror

conn.commit()
