# Setting Up SQL Server in Docker and Connecting with Azure Data Studio

This provides step-by-step instructions to set up SQL Server in a Docker container and connect to it using Azure Data Studio on macOS.

## Prerequisites

- **Docker** installed on your system.
- **Azure Data Studio** installed on your system.

If you don't have Docker or Azure Data Studio installed, follow the instructions below.

## Table of Contents

- [Installing Docker on macOS](#installing-docker-on-macos)
- [Installing Azure Data Studio](#installing-azure-data-studio)
- [Steps for macOS](#steps-for-macos)
  - [1. Run the Docker Container for SQL Server](#1-run-the-docker-container-for-sql-server)
  - [2. (If Needed) Resolve Container Name Conflict](#2-if-needed-resolve-container-name-conflict)
  - [3. Execute into the Running Container as Root with Bash Shell](#3-execute-into-the-running-container-as-root-with-bash-shell)
  - [4. Inside the Container, Update the Package Lists](#4-inside-the-container-update-the-package-lists)
  - [5. Install `mssql-tools` and `unixodbc-dev` Inside the Container](#5-install-mssql-tools-and-unixodbc-dev-inside-the-container)
  - [6. Add `mssql-tools` to Your PATH (Optional but Recommended)](#6-add-mssql-tools-to-your-path-optional-but-recommended)
  - [7. Connect to SQL Server Using `sqlcmd`](#7-connect-to-sql-server-using-sqlcmd)
  - [8. Within `sqlcmd`, Create a New Database Named `kyw`](#8-within-sqlcmd-create-a-new-database-named-kyw)
  - [9. Create a New SQL Login `kywAdmin` with a Password](#9-create-a-new-sql-login-kywadmin-with-a-password)
  - [10. Switch to the `kyw` Database](#10-switch-to-the-kyw-database)
  - [11. Create a Database User `kywAdmin` Linked to the Login](#11-create-a-database-user-kywadmin-linked-to-the-login)
  - [12. Add `kywAdmin` to the `db_owner` Role](#12-add-kywadmin-to-the-db_owner-role)
- [Connecting with Azure Data Studio](#connecting-with-azure-data-studio)
  - [13. Create a Connection to the Local SQL Server Instance](#13-create-a-connection-to-the-local-sql-server-instance)

---

## Installing Docker on macOS

If you don't have Docker installed on your macOS system, follow these steps:

1. **Download Docker Desktop for Mac:**

   - Download from the [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop) download page.

2. **Install Docker Desktop.**

3. **Verify Installation:**

   - Once Docker Desktop is running, you should see the Docker icon in your menu bar at the top of the screen.
   - Open a terminal and run the following command to verify that Docker is installed correctly:

     ```bash
     docker --version
     ```

   - You should see output similar to:

     ```
     Docker version XX.XX.X, build XXXXXX
     ```

---

## Installing Azure Data Studio

If you don't have Azure Data Studio installed, follow these steps:

1. **Download Azure Data Studio:**

   - Visit the [Azure Data Studio Download Page](https://learn.microsoft.com/en-us/sql/azure-data-studio/download-azure-data-studio).

2. **Install Azure Data Studio.**

3. **Launch Azure Data Studio:**
   - Login with your account.

---

## Steps for macOS

### 1. Run the Docker Container for SQL Server

```bash
docker run --platform linux/amd64 -e "ACCEPT_EULA=Y" -e 'SA_PASSWORD=YourPassword' -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2019-latest
```

- **Note:** Replace `'YourPassword'` with a strong password of your choice.

### 2. (If Needed) Resolve Container Name Conflict

If you receive an error about the container name already being in use, remove the existing container:

```bash
docker rm -f sqlserver
```

Then, rerun the Docker command from [Step 1](#1-run-the-docker-container-for-sql-server).

### 3. Execute into the Running Container as Root with Bash Shell

```bash
docker exec -it -u root sqlserver /bin/bash
```

### 4. Inside the Container, Update the Package Lists

```bash
apt-get update
```

### 5. Install `mssql-tools` and `unixodbc-dev` Inside the Container

```bash
apt-get install -y mssql-tools unixodbc-dev
```

### 6. Add `mssql-tools` to Your PATH (Optional but Recommended)

```bash
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc
```

### 7. Connect to SQL Server Using `sqlcmd`

```bash
/opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'YourPassword'
```

### 8. Within `sqlcmd`, Create a New Database Named `kyw`

```sql
CREATE DATABASE kyw;
GO
```

### 9. Create a New SQL Login `kywAdmin` with a Password

```sql
CREATE LOGIN kywAdmin WITH PASSWORD = 'YourPassword';
GO
```

### 10. Switch to the `kyw` Database

```sql
USE kyw;
GO
```

### 11. Create a Database User `kywAdmin` Linked to the Login

```sql
CREATE USER kywAdmin FOR LOGIN kywAdmin;
GO
```

### 12. Add `kywAdmin` to the `db_owner` Role

```sql
ALTER ROLE db_owner ADD MEMBER kywAdmin;
GO
```

---

## Connecting with Azure Data Studio

### 13. Create a Connection to the Local SQL Server Instance

1. **Launch Azure Data Studio.**

2. **Add a New Connection:**

   - Click on the **"New Connection"** button or navigate to **File > New Connection**.

3. **Enter Connection Details:**

   - **Connection Type:** `Microsoft SQL Server`
   - **Server:** `localhost`
   - **Authentication Type:** `SQL Login`
   - **User name:** `kywAdmin`
   - **Password:** `YourPassword`
   - **Database (Optional):** You can select `kyw` from the dropdown or leave it as `Default`.
   - **Server Group (Optional):** You can add the connection to a server group.
   - **Name (Optional):** Give a friendly name to your connection.

4. **Save the Password (Optional):**

   - Check **"Remember password"** if you don't want to enter it each time.

5. **Connect:**

   - Click **"Connect"** to establish the connection.

6. **Verify the Connection:**

   - Upon successful connection, you will see your server and databases in the **Connections** tab on the left.

7. **Explore Your Database:**

   - You can now run database queries. Expand the `kyw` database to view its tables, views, stored procedures, and more.

8. **Run The Queries in Azure Data Studio:**
  #### Order to Load Tables and Views for the Database:
   - **NRD**
   - **County**
   - **School**
   - **Well Info**
   - **Field Activity**
   -  **Classroom Lab**
   -  **Land Feature**
   -  **Water Science Lab**
   -  **Image**
   -  **Tooltip**
   -  **Tooltip Image**
   -  **All Well Field Class**
   -  **All Well Field Class WSL**

**Note:** If you encounter a proxy error, run this query to insert data into the tblNRDLookup and tblSchool tables.
#### SQL Query to Insert Data into `tblNRDLookup` and `tblSchool`:

```sql
USE [kyw];

INSERT INTO tblNRDLookup (nrd_id, nrd_name, nrd_abbr)
VALUES (2, 'Natural Resource District', 'NRD');

SET IDENTITY_INSERT tblSchool ON;
GO

INSERT INTO tblSchool (school_id, sch_name, sch_code, sch_address, nrd_id, sch_latitude, sch_longitude, sch_activeflag, sch_datedeactivated, sch_comments)
VALUES (1, 'testSchool', 'UNL', '1400 R Street Lincoln, NE 68588', '2', 40.817640, -96.700000, 1, NULL, NULL);

SET IDENTITY_INSERT tblSchool OFF;
GO
```

**Note:** If you encounter issues with the tooltips feature, drop the tblTooltip and tblToolipImage tables and run this query to reset the data in them.
#### SQL Query to Insert Data into `tblTooltip` and `tblTooltipImage`:

```sql
USE [kyw];

INSERT INTO  tblTooltip (prompt_id, text, active) values ('aquifertype', 'An unconfined aquifer is easily accessible through the unsaturated layer and starts at the top of the water table and ends when there is an impermeable layer or bedrock beneath it. A confined aquifer, sometimes called an artesian aquifer, lies between two impermeable layers, called confining layers. Confined aquifers often have increased water pressure which, when accessed, may produce flowing water without the need for a pump.', 1)

INSERT INTO tblTooltip (prompt_id, text, active) values ('wellcover', 'Located at the top of the well and is usually the most visible. The head is a durable piece of PVC or metal that is capped to keep debris out of the well. A smaller pipe is attached protecting the wires attached to the pump. It is often above ground, but sometimes may be located inside a well house or well pit.', 1)

INSERT INTO tblTooltipImage (prompt_id, im_filename, active) values ('aquifertype', 'aquifertype-1.jpg', 1)
```


9. Add `config.json` to the `knowyourwell` Directory

After setting up the database and ensuring connectivity, create a `config.json` file in the `knowyourwell` directory with the following content:

```json
{
    "user": "kywAdmin",
    "password": "YourPassword",
    "database": "kyw",
    "server": "localhost",
    "pool": {
        "max": 10,
        "min": 0,
        "idleTimeoutMillis": 30000
    },
    "options": {
        "encrypt": true,
        "trustServerCertificate": true
    }
}
```

This configuration file contains the connection details necessary for accessing the SQL Server. Be sure to replace `YourPassword` with your actual password.

---
