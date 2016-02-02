# NYC-Map-Traffic-Visualization

Execute query - CREATE TABLE tweets(
				id varchar(80) primary key,
				date date,
				time time,
				day varchar(10),
				latitude double precision,
				longitude double precision,
				content varchar(200),
				hashtags varchar(200),
				nameless varchar(50));

Create a virtual environment:

Instructions on - http://docs.python-guide.org/en/latest/dev/virtualenvs/

After activating virtual environment, execute -

pip install -r requirements.txt 