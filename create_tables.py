import psycopg2

f = open('dfconfig.txt','r')
config = f.read()
print config
conn = psycopg2.connect(config)
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

except psycopg2.Error as e:
	print e.pgerror
conn.commit()

