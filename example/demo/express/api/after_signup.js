const MongoClient = require('mongodb').MongoClient;

module.exports = async function(req, res) {
  try {
    const user = req.body.data;

    const client = await connectDB();
    await saveUser(client, user);
    client.close();

    res.send(user);
  } catch (err) {
    throw err;
  }
};

function connectDB() {
  return new Promise((resolve, reject) => {
    const uri = process.env.MONGO_DB_URL;
    const client = new MongoClient(uri, { useNewUrlParser: true });

    client.connect((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(client);
    });
  });
}

function saveUser(client, user) {
  return new Promise((resolve, reject) => {
    const collection = client.db('test').collection('users');
    collection
      .updateOne({ id: user.user_id }, { $set: user }, { upsert: true })
      .then((err, result) => {
        resolve(user);
        client.close();
      })
      .catch((err) => {
        reject(err);
      });
  });
}
