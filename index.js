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

// connect MongoDB mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  username: String,
  log: []
});

const exerciseSchema = new mongoose.Schema({
  uid: String,
  username: String,
  description: { type: String, require: true },
  duration: { type: Number, require: true },
  date: Date
});

// MongoDB Models
const UserModel = mongoose.model('UserModel', userSchema);
const ExerciseModel = mongoose.model('ExerciseModel', exerciseSchema);

// enable bodyparser
app.use('/', bodyParser.urlencoded({ extended: false }));

// post API endpoints
app.post('/api/users', function(req, res) {
  let newUsername = req.body.username;
  createAndSaveNewUser(newUsername, res);
});

app.post('api/users/:_id/exercises', function(req, res) {
  let uid = req.body[":_id"];
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  let newExerciseObj = {
    uid: uid,
    username: '',
    description: description,
    duration: duration,
    date: date
  }
  createAndAddExercisesTo(uid, newExerciseObj, res);
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
    response.json({error: 'something went wrong saving new user.'});
  })
}

function createAndAddExercisesTo(userID, exerciseObj, response) {
  exerciseObj.save().then((exerciseData) => {
    console.log('Saving exercise ' + exerciseData.description + ': Success...');
    response.redirect('https://fcc-exercise-tracker.dlee923.repl.co/api/users/' + userID + '/exercises');
  }).catch((err) => {
    console.log('Saving exercise ' + exerciseObj.description + ': Error...');
    response.json({error: 'something went wrong saving exercise.'});
  })
}

// get API endpoints
app.get('/api/users', function(req, res) {
  UserModel.find().select(['username']).then((usernameData) => {    
    console.log('Query users: Success...');
    res.json({usernameData});
  }).catch((err) => {
    logError("Query users", err);
  })
});

app.get('/api/users/:id/logs', function(req, res) {
  let username = ''
  let count = ''
  let _id = req.params.id;
  let log = ''
  UserModel.find().where('username').all(req.params.id).then((usernameData) => {
    console.log('Query one user: Success...')
    username = usernameData.username;

    ExerciseModel.find({_id: _id}).then((exerciseData) => {
      console.log('Query user exercises: Success...')
      log = exerciseData
      let logObj = {
        username: username,
        count: log.length,
        _id: _id,
        log: log
      }
      res.json(logObj);
    }).catch((err) => {
      logError('Query user exercises', err);
    })
    
  }).catch((err) => {
    logError('Query one user', err);
  })
});

function logError(fxPurpose, err) {
  console.log('------------ ' + fxPurpose + ': Error... ------------');
  console.log(err)
  console.log('------------ Error ------------');
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
