Node JS Backend for Todo
========================

### How to start 

- create .env file in the root folder of the project:

```
### Database 
...
APP_DB_RESETONSTART= true

### API
APP_SERVER_PORT= 3000
```

- example for MySQL configuration:
```
### Database
APP_DB_TYPE= mysql
APP_DB_HOST= localhost
APP_DB_USER= root
APP_DB_PASSWORD= 1
APP_DB_DATABASE= todos
```

 if you use MySQL database, so you'll need to create it in your db client and name it as `APP_DB_DATABASE` property

- example for SQLite configuration:
```
### Database
APP_DB_TYPE= sqlite
APP_DB_PATH= db.sqlite
APP_DB_DATABASE= todos
```

- start the backend

```bash
npm install
npm start
```

