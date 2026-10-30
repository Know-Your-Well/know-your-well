# HowToRunDevOfflineFunctionalityTestingMode.md

author: Zoorackzoos (Duncan Holmes)

## abstract
there's 2 ways you can do this
* actually deploying the damn thing
* build the react app and run it against our backend server
  * i'm going to elaborate on this one. i haven't deployed this app.

## build the react app and run it against our backend server
I don't know how the team tested offline functionally before us.  
maybe they had a pipeline to production and were free-wheeling it. idk.  
I'll be caught dead messing with production bruz.

you need 2 terminals open for this. so do that please.  

### files in question: 
1. ```knowyourwell/knowyourwell/ClientApp/serve-build.js```
   1. this is "serving" the server, front end beck end sandwich. 
      1. the front end and backend need separate ports. if you have the same then the backend will be confused.
   2. it's not like running it on a registered domain or something. so it's not deploying.
2. ```knowyourwell/knowyourwell/Properties/launchSettings.json```
   1. if you're on vscode then this is important you have to know what's happening.
   2. I'm not on VScode. i'm on webstorm. ignore this if you are on webstorm.
3. ```knowyourwell/knowyourwell/ClientApp/src/setupProxy.js```
   1. this contains a port number setting 

### commands you must know
```bash
#terminal 1
knowyourwell/knowyourwell> npm run server

#terminal 2
knowyourwell/knowyourwell/ClientApp> npm run build 
# it will build. this takes a few minutes.
knowyourwell/knowyourwell/ClientApp> node serve-build.js
# do them at teh same time. it redirects to a command i put in package.json for you <3.
knowyourwell/knowyourwell/ClientApp> npm offline-run
```

any time you changed the program. you need to run ```npm run build``` again.