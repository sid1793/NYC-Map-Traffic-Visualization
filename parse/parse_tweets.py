import psycopg2
import os

def getDirList( p ):
        p = str( p )
        if p=="":
              return []
        a = os.listdir( p )
        return a

conn = psycopg2.connect("dbname='postgres' user='postgres' host='localhost' password='alireliza'")
conn.autocommit= True

cur = conn.cursor()

path = '/home/alireza/workspace/mitsubishi/data/twitter'
FileList = getDirList(path)
for year in FileList:
	if(year == '.DS_Store'): continue
	else: 
		print (year)
		fin = open(os.path.join (path, year),'r')
		content = fin.readlines ()
		fin.close ()

		for line in content:
			csv = line.split('\n')[0].split(',')
			row = {}

			row ['lat'] = csv [0]
			row ['long'] = csv [1]
			row ['day'] = csv [2].split () [0]
			row ['time'] = csv [2] + ' ' + csv [3]
			row ['userid'] = csv [4]
			enidx = 0
			for i in range (5, len (csv)):
				if csv [i] == 'en':
					enidx = i
					break
			if enidx == 0:
				raise 'not english'

			row ['addr'] = ','.join (csv [5:enidx-1])
			row ['tweetid'] = csv [enidx+1]
			row ['content'] = ','.join (csv [enidx+2:])


			try:
				cur.execute('INSERT INTO tweets (time , lat, long,	addr, content, userid) VALUES (%s,%s,%s,%s,%s,%s)', (row['time'], row['lat'], row['long'], row['addr'], row['content'], row['userid']));
			except psycopg2.Error as e:
				print e.pgerror
				break
		conn.commit()

