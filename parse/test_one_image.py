import base64
import psycopg2

try:
	conn = psycopg2.connect("dbname='postgres' user='postgres' host='localhost' password='alireliza'")
	conn.autocommit= True
except Exception, e:
	print e, "Connection Unsucessful"

cur = conn.cursor()


cur.execute("SELECT content FROM images WHERE imageid=12")

row = cur.fetchone()
fh = open('test.jpg','wb')
fh.write(row[0])
