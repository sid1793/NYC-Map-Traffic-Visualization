import json 
import csv
import os

def getDirList( p ):
        p = str( p )
        if p=="":
              return []
        a = os.listdir( p )
        return a

in_path = '../sample_one_week/WAZE/'
out_path = '../sample_one_week/WAZE-CSV/jams/'

if not os.path.exists (out_path):
	os.makedirs(out_path)

firstfilelist = getDirList(in_path)
for firstfile in firstfilelist:
	if(firstfile == '.DS_Store'): continue
	else:
#		print firstfile
		secondfilelist = getDirList(os.path.join (in_path, firstfile))
#		print secondfilelist
		g = open(os.path.join (out_path , firstfile +'.csv'), "w") 
		for secondfile in secondfilelist:
			if(secondfile == '.DS_Store'): continue
			else:
#				print secondfile
				f = open(os.path.join (in_path , firstfile , secondfile), "r") 
				data = json.load(f) 
				f.close()
				template = ["id", "type", "severity", "level", "pubMillis"]
				
				csv_file = csv.writer(g) 
				try:
					for item in data["jams"]: 
						s = []
						for subItem in template:
							if item[subItem]:
								s.append(item[subItem])
							else:
								s.append("\b")
						s.append(item["line"][0]["x"])
						s.append(item["line"][0]["y"])
						csv_file.writerow(s)
				except Exception, e:
					print e
		g.close()
