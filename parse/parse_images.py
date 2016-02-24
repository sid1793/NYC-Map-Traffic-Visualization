import base64
import psycopg2
import os
import string 


def getDirList( p ):
        p = str( p )
        if p=="":
              return [ ]
        a = os.listdir( p )
        return a


try:
	conn = psycopg2.connect("dbname='postgres' user='postgres' host='localhost' password='alireliza'")
	conn.autocommit= True
except Exception, e:
	print e, "Connection Unsucessful"

cur = conn.cursor()

path = '/home/alireza/workspace/mitsubishi/data/images/'
FileList = getDirList(path)
for year in FileList:
	if(year == '.DS_Store'): continue
	else: yearlist = getDirList(path + year)
	for month in yearlist:
		if(month == '.DS_Store'): continue
		else: monthlist = getDirList(path + year + '/' + month)
		for firstfile in monthlist:#5,6,7
			if(firstfile == '.DS_Store'): continue
			else: secondlist = getDirList(path + year + '/' + month + '/' +firstfile)
			for secfile in secondlist:#157balabala
				if(secfile == '.DS_Store'): continue
				else: thirdlist = getDirList(path + year + '/' + month + '/' + firstfile + '/' + secfile)
				for thirdfile in thirdlist:#0,1,2
					if(thirdfile == '.DS_Store'): continue
					else: wenjian = getDirList(path + year + '/' + month + '/' +firstfile + '/' + secfile+ '/' + thirdfile)
					for item in wenjian: 
						f = open(path + year + '/' + month + '/' + firstfile + '/' + secfile + '/' + thirdfile + '/' + item,'rb')
						if(item == '.DS_Store'): continue
						else:
							time = item.split('_')[1]
							if(len(item.split('_'))== 3):
								timesec = (item.split('_')[2]).split('.')[0]
							else: 
								timesec = '0-0'
								print item
							if(len(timesec.split('-')) == 2):
								minu = timesec.split('-')[0]
								sec = timesec.split('-')[1]
								timestamp = time + ' ' + thirdfile + ':' + minu + ':' + sec
							else: timestamp = time + ' ' + thirdfile + ':' + '0' + ':' + '0'
							
							cameinfo = secfile.split('_')
							nameofcamera = ''
							for i in range(1, len(cameinfo) - 1):
								nameofcamera += (cameinfo[i] + '_')
							nameofcamera += cameinfo[len(cameinfo) - 1]

							fin = f.read()
							bin = psycopg2.Binary(fin)

							try:
								bin = psycopg2.Binary(fin)
								cur.execute("INSERT INTO images(content, time, camname) VALUES (%s,\'%s\',\'%s\')" %(bin.getquoted(), timestamp, nameofcamera))
								
							except psycopg2.Error as e:
								print nameofcamera
#								print e.pgerror

