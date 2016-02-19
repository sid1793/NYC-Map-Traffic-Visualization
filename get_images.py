import base64
import psycopg2
import os 


try:
	conn = psycopg2.connect("dbname='mydb' user='Siddhesh' host='localhost' password='Mhatre1793'")
	conn.autocommit= True
except Exception, e:
	print e, "Connection Unsucessful"

cur = conn.cursor()

id = 0
for root, dirs, files in os.walk("sample-data/Camera/2015/10/157-92_Holland_Tunnel/"):
	for name in files:
			f = open(os.path.join(root,name))
			fin = f.read()
			bin = psycopg2.Binary(fin)

			try:
				id +=1
				cur.execute("INSERT INTO images(id, image) VALUES (%s,%s)" %(id,bin.getquoted()))
			except psycopg2.Error as e:
				print e.pgerror




