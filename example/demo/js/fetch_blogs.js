const MongoClient = require('mongodb').MongoClient;

module.exports = async function (req, res) {
  try {
    const client = await connectDB();
    const blogs = await fetchBlogs(client);
    client.close();
    res.send({
      result: blogs
    });
  } catch (err) {
    throw err;
  }
}

function connectDB() {
  return new Promise((resolve, reject) => {
    const uri = 'mongodb+srv://skygear-demo:skygear-demo@skygear-demo-tfhwi.gcp.mongodb.net/test?retryWrites=true';//process.env.MONGO_DB_URL;
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

function fetchBlogs(client) {
  return new Promise((resolve, reject) => {
    const collection = client.db('test').collection('blogs');
    collection.find().toArray( (err, result) => {
      if (err) {
        reject(err);
        return
      }

      resolve(result);
    });
  });
}