# how to create a local testing database
this is confusing & asks you jump around places

## setting up MSSQL, the closest thing to azure.
* download [SQL Server 2025 Developer](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
* run these following commands:

to get into your MSSQL (microsoft sql terminal interface). the -C is for the certificate.
```
sqlcmd -S localhost -E -C
```

once you're in there, do this:
```
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2
GO
ALTER LOGIN Username ENABLE
GO
ALTER LOGIN Username WITH PASSWORD = 'YourPasswordYouNeedToPutInYourself'
GO
CREATE DATABASE kywdev
GO
EXIT
```
you can also make "kywdev" a different name if you want.

how to restart the service. do this after:
```
Restart-Service MSSQLSERVER
```

verify the database you created exists:
```
sqlcmd -S localhost -E -C -Q "SELECT name FROM sys.databases"
```
it does if you get "kywdev" plus some junk databases.

test your user login:
```
sqlcmd -S localhost -U Username -P "YourPasswordYouNeedToPutInYourself" -C -Q "SELECT DB_NAME()"
```
Username, is your username :- )

## cloning a data-less version of the production tables
from there open webstorm.

Open the Database tool window (right sidebar, or View → Tool Windows → Database).
Click + → Data Source → Microsoft SQL Server.
Fill in the General tab:
Name: LOCAL DEV
Host: localhost
Port: 1433
Authentication: User & Password
User: Username
Password: the one you set
Database: kywdev

If WebStorm shows a "Download missing driver files" link at the bottom, click it.
Click Test Connection.

### If the test fails with a certificate or SSL error
Open the Advanced tab, find trustServerCertificate, and set it to true. If it's not listed, click the + there and add it. Then test again.

### If it fails with "connection refused" or can't connect at all
TCP/IP is probably off. Open SQL Server Configuration Manager (Start menu), go to SQL Server Network Configuration → Protocols for MSSQLSERVER, enable TCP/IP, and restart the service again, as admin this time.

### If it fails with "Login failed for user 'Username'"
The mixed-mode change hasn't taken effect, so restart the service. If it still fails after a restart, rerun the ALTER LOGIN sa ENABLE and password commands.

### Once it connects
Right-click LOCAL DEV → New → Query Console.
Run SELECT DB_NAME(); and confirm it says kywdev.
Paste your generated schema script and run it.
Right-click LOCAL DEV → Refresh, then expand kywdev → dbo. You should see your empty tables.

## seeing the tables in WebStorm
You need to select the scheema to see them for some reason.
1. right click the database name
2. properties
3. Scheemas
4. "all scheema" or just the tables you want. if you click 'all' then you'll get the junk tables too.

the tables are in ```dbo``` so always have that checked.
it's kinda confusing to find dbo if every junk table is checked.