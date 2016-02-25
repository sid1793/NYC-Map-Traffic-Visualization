import psycopg2

fconf = open ('dbconfig.txt', 'r')
conf = fconf.read()
conn = psycopg2.connect(conf)
conn.autocommit= True

cur = conn.cursor()

fin = open('cam_coordinates.csv','r')
content = fin.readlines ()
fin.close ()

for line in content:
	csv = line.split('\n')[0].split(',')
	row = {}

	row ['name'] = csv [0]
	row ['lat'] = csv [1]
	row ['long'] = csv [2]

	try:
		cur.execute('INSERT INTO camera VALUES (%s,%s,%s)', (row['name'], row['lat'], row['long']));
	except psycopg2.Error as e:
		print row['lat']
		print e.pgerror
conn.commit()

