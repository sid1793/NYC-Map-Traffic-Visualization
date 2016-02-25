import psycopg2
import os

def getDirList( p ):
        p = str( p )
        if p=="":
              return []
        a = os.listdir( p )
        return a

fconf = open ('dbconfig.txt', 'r')
conf = fconf.read()
conn = psycopg2.connect(conf)
conn.autocommit= True
cur = conn.cursor()

path = '../sample_one_week/WAZE-CSV/jams/'
firstfilelist = getDirList(path)

for year in firstfilelist:
	if(year == '.DS_Store'): continue
	else: 
		print (year)
		fin = open(os.path.join (path, year),'r')
		content = fin.readlines ()
		fin.close ()

		for line in content:
			csv = line.split('\n')[0].split(',')
			row = {}

			row ['jamsid'] = csv [0]
			row ['type'] = csv [1]
			row ['severity'] = csv [2]
			row ['level'] = csv[3]
			row ['pubMillis'] = csv [4]
			row ['location_x'] = csv [5]
			row ['location_y'] = csv [6]

			try:
				cur.execute('INSERT INTO jams (jamid, type, severity, level, time, location_lat, location_long) VALUES (\'%s\',\'%s\',%s,%s,to_timestamp(%d),%s,%s)'% (row ['jamsid'], row['type'], row['severity'], row['level'], int(row['pubMillis'])/1000, row['location_x'], row['location_y']));
			except psycopg2.Error as e:
				pass
#				print e.pgerror
		conn.commit()



