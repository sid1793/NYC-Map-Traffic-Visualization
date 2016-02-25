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

path = '../sample_one_week/WAZE-CSV/alerts/'
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
			
			row ['alertsid'] = csv [0]
			row ['type'] = csv [1]
			row ['subtype'] = csv [2]
			row ['pubMillis'] = csv [3]
			row ['location_x'] = csv [4]
			row ['location_y'] = csv [5]

			try:
				cur.execute('INSERT INTO alerts (alertid, type, subtype, time, location_lat, location_long) VALUES (\'%s\',\'%s\',\'%s\',to_timestamp(%d),%s,%s)'% (row ['alertsid'], row['type'], row['subtype'], int(row['pubMillis'])/1000, row['location_x'], row['location_y']));
			except psycopg2.Error as e:
				pass
#				print e.pgerror
		conn.commit()



