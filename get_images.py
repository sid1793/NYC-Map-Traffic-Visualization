import base64
import psycopg2


try:
	conn = psycopg2.connect("dbname='mydb' user='Siddhesh' host='localhost' password='Mhatre1793'")
	conn.autocommit= True
except Exception, e:
	print e, "Connection Unsucessful"

cur = conn.cursor()

f = open('/Users/Siddhesh/Spring 2016/Introduction to Databases/Proj1/92_2015-12-10_0-0.jpg','rb')
fin = f.read()

bin = psycopg2.Binary(fin)

try:
	id = 13
	bin = psycopg2.Binary(fin)
	cur.execute("INSERT INTO test_images(id, image) VALUES (%s,%s)" %(id,bin.getquoted()))
	cur.execute("SELECT image FROM test_images WHERE id=12")
except psycopg2.Error as e:
	print e.pgerror

row = cur.fetchone()
fh = open('test.jpg','wb')
fh.write(row[0])

