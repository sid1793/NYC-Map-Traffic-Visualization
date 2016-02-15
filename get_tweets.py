import psycopg2
import csv

try:
	conn = psycopg2.connect("dbname='mydb' user='Siddhesh' host='localhost' password='Mhatre1793'")
	conn.autocommit= True
except:
	print "Connection unsuccessful"

cur = conn.cursor()

f = open('sample-data/NYC-2015-12-04.csv','rb')

try:
	reader = csv.reader(f)
	for row in reader:
		index = -1
		hashtags = []
		'''Creating hashtags'''
		for i in range(0,row[8].count('#')):
			tag=''
			index = row[8].find('#',index+1,len(row[8]))
			k=index
			tag +=row[8][k]
			k+=1
			while (k<len(row[8]) and row[8][k] != ' ' and row[8][k] != '#'):
				tag += row[8][k]
				k+=1
			hashtags.append(tag)	

		hashtag=','.join(hashtags)

		dict = {'id':row[4],'date':row[2],'time':row[3],'day':row[2].split()[0],'lat':float(row[1]),'long':float(row[0]),'location':row[5],'content':row[8],'hashtag':hashtag,'nameless':row[7]}
		
		try:
			cur.execute('INSERT INTO tweets VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',(dict['id'],dict['date'],dict['time'],dict['day'],dict['lat'],dict['long'],dict['location'],dict['content'],dict['hashtag'],dict['nameless']))
		except psycopg2.Error as e:
			print e.pgerror
	conn.commit()

finally:
	f.close()