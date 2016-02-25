import psycopg2

fconf = open ('dbconfig.txt', 'r')
conf = fconf.read()
conn = psycopg2.connect(conf)
conn.autocommit= True

cur = conn.cursor()
try:
	cur.execute('CREATE TABLE IF NOT EXISTS CAMERA(\
		name varchar(50),\
		location_lat float,\
		location_long float,\
		PRIMARY KEY(name)\
	);');

	cur.execute('CREATE TABLE IF NOT EXISTS IMAGES (\
		imageid BIGSERIAL NOT NULL,\
		content BYTEA,\
		time TIMESTAMP,\
		camname varchar(50),\
		PRIMARY KEY(imageid),\
		FOREIGN KEY(camname) REFERENCES CAMERA(name)\
	);');

	cur.execute('CREATE TABLE IF NOT EXISTS TWEETS(\
		tweetid BIGSERIAL NOT NULL,\
		time TIMESTAMP,\
		lat FLOAT,\
		long FLOAT,\
		addr varchar(200),\
		content varchar(1000),\
		userid BIGINT,\
		PRIMARY KEY(tweetid)\
	);');

	cur.execute('CREATE TABLE IF NOT EXISTS OBJECT(\
		objid BIGSERIAL NOT NULL,\
		name varchar(50),\
		PRIMARY KEY(objid)\
	);');

	cur.execute('CREATE TABLE IF NOT EXISTS detection_in(\
		detid BIGSERIAL NOT NULL,\
		imageid BIGINT,\
		objid INT,\
		descriptor BYTEA,\
		bbox_x INT,\
		bbox_y INT,\
		bbox_w INT,\
		bbox_h INT,\
		PRIMARY KEY(detid),\
		FOREIGN KEY(imageid) REFERENCES IMAGES (imageid),\
		FOREIGN KEY(objid) REFERENCES object (objid)\
	);');

	cur.execute('CREATE TABLE IF NOT EXISTS ALERTS(\
		alertid varchar(100),\
		type varchar(20),\
		subtype varchar(30),\
		time TIMESTAMP,\
		location_lat float,\
		location_long float,\
		PRIMARY KEY(alertid)\
	);');

	cur.execute('CREATE TABLE IF NOT EXISTS JAMS(\
		jamid varchar(50),\
		type varchar(20),\
		severity int,\
		level int,\
		time TIMESTAMP,\
		location_lat float,\
		location_long float,\
		PRIMARY KEY(jamid)\
	);');

except psycopg2.Error as e:
	print e.pgerror
conn.commit()

