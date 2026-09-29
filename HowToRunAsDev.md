# how to run as dev

follow these steps.
1. install .NET 6.0 ![here](https://dotnet.microsoft.com/en-us/download/dotnet/6.0)
2. go to ```knowyourwell/knowyourwell``` in your terminal
3. run ```npm install```
4. create a ".env" file in the directory: ```knowyourwell/knowyourwell/.env``` and have the field: ```APPSETTING_MSSQL_PASSWORD=``` populated with your password. you have to addd that field text.
5. Uncomment out line 15 of ```knowyourwell/knowyourwell/index.js``` so that it fetches what's in the environment file
6. Make sure the nodemon package is installed in npm, otherwise you will be unable to run it.
   a. npm install -g nodemon
7. Run ```npm run server```. That runs the backend, without it you can't get past the 1st screen.
8. now, run the client with ```npm start```

now you can develop. 

if at any point you do a npm action, be sure to go back to ```knowyourwell/knowyourwell/index.js``` and uncomment line 15 again.