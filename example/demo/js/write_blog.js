const MongoClient = require('mongodb').MongoClient;

module.exports = async function (req, res) {
  try {
    const userID = req.body.args.userID;
    const title = req.body.args.title;
    const content = req.body.args.content;
    
    const client = await connectDB();
    await saveBlog(client, userID, title, content);
    client.close();
    
    res.send('OK');
  } catch (err) {
    throw err;
  }
}

function connectDB() {
  return new Promise((resolve, reject) => {
    const uri = process.env.MONGO_DB_URL;
    const client = new MongoClient(uri, { useNewUrlParser: true });

    client.connect(err => {
      if (err) {
        reject(err);
        return;
      }
      resolve(client);
    });
  });
}

function saveBlog(client, userID, title, content) {
  return new Promise((resolve, reject) => {
    const collection = client.db('test').collection('blogs');
    const data = { title, content, userID: userID };
    collection.insertOne(data, (err, result) => {
      if (err) {
        reject(err);
        return
      }

      resolve(result);
    });
  });
}