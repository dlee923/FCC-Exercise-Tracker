const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
let bodyParser = require('body-parser')

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// connect MongoDB mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  username: String,
  log: { type: Array, require: false }
});

const exerciseSchema = new mongoose.Schema({
  description: { type: String, require: true },
  duration: { type: Number, require: true },
  date: Date
});

// MongoDB Models
const UserModel = mongoose.model('UserModel', userSchema);

// enable bodyparser
app.use('/', bodyParser.urlencoded({ extended: false }));

// post API endpoints
app.post('/api/users', function(req, res) {
  let newUsername = req.body.username;
  createAndSaveNewUser(newUsername, res);
});

app.post('/api/users/:id/exercises', function(req, res) {
  let uid = req.params.id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = /\d\d\d\d-\d\d-\d\d/.test(req.body.date)? req.body.date: Date.now();
  let newExerciseObj = {
    description: description,
    duration: Number(duration),
    date: new Date(date).getTime()
  }
  UserModel.findOne({ _id: uid }).then((usernameData) => {
    createAndAddExercisesTo(uid, usernameData.username, newExerciseObj, res);
  }).catch((err) => {
    logError("Querying username from uid", err, res);
  })
});

// post helper methods
function createAndSaveNewUser(username, response) {
  let newUser = UserModel({
    username: username
  });
  newUser.save().then((newUserData) => {
    console.log('Saving new user ' + newUserData.username + ': Success...');
    response.json({ username: newUserData.username, _id: newUserData._id });
  }).catch((err) => {
    console.log('Saving new user ' + username + ': Error...')
    response.json({ error: 'something went wrong saving new user.' });
  })
}

function createAndAddExercisesTo(userID, username, exerciseObj, response) {
  UserModel.findByIdAndUpdate(userID, { $push: { log: exerciseObj } }, { new: true, upsert: true }).then((userExerciseData) => {
    console.log('Saving exercise ' + exerciseObj.description + ': Success...');
    let userExerciseObj = {
      _id: userID,
      username: username,
      date: new Date(exerciseObj.date).toDateString(),
      duration: exerciseObj.duration,
      description: exerciseObj.description
    }
    response.json(userExerciseObj);
  }).catch((err) => {
    console.log('Saving exercise ' + exerciseObj.description + ': Error...');
    response.json({ error: 'something went wrong saving exercise.' });
  })
}

// get API endpoints
app.get('/api/users', function(req, res) {
  UserModel.find().select(['username']).then((usernameData) => {
    console.log('Query users: Success...');
    res.json(usernameData);
  }).catch((err) => {
    logError("Query users", err, res);
  })
});

app.get('/api/users/nofilter', function(req, res) {
  UserModel.find().then((usernameData) => {
    console.log('Query users: Success...');
    res.json(usernameData);
  }).catch((err) => {
    logError("Query users", err, res);
  })
});

app.get('/api/users/:id/logs', function(req, res) {
  console.log('/api/users/' + req.params.id + '/logs?' + 'from=' + req.query.from + '&to=' + req.query.to + '&limit=' + req.query.limit);
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;

  UserModel.findById(req.params.id)
    .then((usernameExerciseData) => {
    console.log('Query user exercises: Success...');

    // initialize with default log data
    let filteredLogData = usernameExerciseData.log;
    
    // Filter log data based on from-to parameters
    if (from != null && /\d\d\d\d-\d\d-\d\d/.test(from) && to != null && /\d\d\d\d-\d\d-\d\d/.test(to)) {
      console.log('from: ' + from);
      console.log('to: ' + to);
      let fromDate = new Date(from).getTime();
      let toDate = new Date(to).getTime();
      filteredLogData = filteredLogData.filter(log => log.date >= fromDate && log.date <= toDate);
    } else if (from != null && /\d\d\d\d-\d\d-\d\d/.test(from)) {
      console.log('from: ' + from);
      let fromDate = new Date(from).getTime();
      filteredLogData = filteredLogData.filter(log => log.date >= fromDate);
    } else if (to != null && /\d\d\d\d-\d\d-\d\d/.test(to)) {
      console.log('to: ' + to);
      let toDate = new Date(to).getTime();
      filteredLogData = filteredLogData.filter(log => log.date <= toDate);
    }

    // Filter log data based on limit parameter
    if (limit) {
      console.log('limit--------: ' + limit)
      if (limit > 0) {
        filteredLogData = filteredLogData.slice(0, limit);  
      } else {
      filteredLogData = filteredLogData;
      }
    } else {
      filteredLogData = filteredLogData;
    }

    // Convert all dates to a string
    filteredLogData.forEach(log => log.date = new Date(log.date).toDateString())
    
    let usernameExerciseLogData = {
      _id: usernameExerciseData._id,
      username: usernameExerciseData.username,
      count: filteredLogData.length,
      log: filteredLogData
    }
    res.json(usernameExerciseLogData);
  }).catch((err) => {
    logError('Query user exercises', err, res);
  })
});

function logError(fxPurpose, err, response) {
  console.log('------------ ' + fxPurpose + ': Error... ------------');
  console.log(err)
  console.log('------------ Error ------------');
  response.json({ error: 'invalid request' })
}

