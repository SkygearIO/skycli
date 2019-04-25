## Step 1: Setup environment

1. Install `skycli`. In your terminal, run:
```shell=bash
$ npm install -g skycli
```
2. Create a folder for the project:
```shell=bash
$ mkdir myProject && cd myProject
```
3. Set skygear controller location
```
$ skycli config set-cluster-server
? Cluster server endpoint: https://controller.dev.skygearapis.com
? Cluster api key: b1827833558e4e1cb397e1b8ade1aabd
```
4. Check config
```shell=bash
$ skycli config view
┌──────────────────┬───────────────────────┐
│ Property         │ Value                 │
├──────────────────┼───────────────────────┤
│ Cluster Type     │ enterprise            │
├──────────────────┼───────────────────────┤
│ Cluster Endpoint │ <endpoint>            │
├──────────────────┼───────────────────────┤
│ Cluster API Key  │ <api key              │
├──────────────────┼───────────────────────┤
│ Account          │                       │
└──────────────────┴───────────────────────┘
```
5. Singup a new Skygear controller user:
```shell=bash
$ skycli auth signup
? Email: <email>
? Password: [input is hidden]
Sign up as <email>
```
6. Create a Skygear app for our project:
```shell=bash
$ skycli.js app create
? What is your app name? <appName>
Creating app...
Your API endpoint: https://<appName>.v2.dev.skygearapis.com/.
Your Client API Key: <api key>.
Your Master API Key: <master api key>.
Created app successfully!

? Do you want to setup the project folder now? Or you can do it later by `skycli app scaffold` command.
Setup now? (Y/n) Y
? You're about to initialze a Skygear Project in this directory: ~/myProject
Confirm? (Y/n)

Fetching examples...
? Select example: (Use arrow keys)
  empty
❯ nodejs-example

Fetching js-example and initializing..
Success! Initialized "nodejs-example" template in "~/myProject".
```
6. Check result
```
$ ls
hello-world  skygear.yaml
$ cat skygaer.yaml
app: myProject
cf:
  function1:
    type: http-handler
    path: /hello-world
    env: node
    src: hello-world
$ cat hello-world/index.js
module.exports = async function (context) {
    console.log("headers=", JSON.stringify(context.request.headers));
    console.log("body=", JSON.stringify(context.request.body));

    return {
        status: 200,
        body: "Hello, world !\n"
    };
}
```

## Step 2: Setup database

1. Create an account on https://www.mongodb.com/cloud/atlas
2. And create a cluster (M0 Sandbox is free).
3. Set Cluster Name (e.g. `skygear-demo`).
4. Then click security tab and create database user.
5. Set IP Whitelist
   1. Click "ADD IP ADDRESS"
   2. CLick "ALLOW ACCESS FROM ANYWHERE"
6. Back to "Overview" tab, and find detail connect information by click "connect" button.
7. `skycli secret create MONGO_DB_URL mongodb+srv://skygear-demo:skygear-demo@skygear-demo-tfhwi.gcp.mongodb.net/test?retryWrites=true
`

## Step 3: Setup after-signup-hook

1. Show and explain `demo/js/after_signup.js`
2. add following section to skygear.yaml
```
after_signup:
    type: http-handler
    path: /after_signup
    hook:
        event: after_signup
        async: true
        timeout: 65
    env: nodejs
    entry: after_signup
    src: js
    secrets:
        - MONGO_DB_URL
```
3. `skycli app deploy --cloud-code after_signup`

## Step 3: Setup frontend

1. Go to frontend folder
```
$ cd frontend
$ npm install
```
2. Update app endpoint in main.js
3. Run locally
```
$ node app.js
```
4. Open browser, and type in url
```
$ curl http://localhost:8080
```
5. Now you can find a basic UI for user signup
6. Show after signup result in mongodb

## Step 4: Write blog

1. Show cloud code `demo/js/write_blog.js`
2. Set skygear.yaml
```
write_blog:
    type: http-handler
    path: /write_blog
    env: nodejs
    entry: write_blog
    src: js
    secrets:
        - MONGO_DB_URL
```
3. `skycli app deploy --cloud-code write_blog`
4. Demo write blog

## Step 5: List blogs

1. Show cloud code `demo/js/fetch_blogs.js`
2. Set skygear.yaml
```
fetch_blogs:
    type: http-handler
    path: /fetch_blogs
    env: nodejs
    entry: fetch_blogs
    src: js
    secrets:
        - MONGO_DB_URL
```
3. `skycli app deploy --cloud-code fetch_blogs`
4. Demo list blogs