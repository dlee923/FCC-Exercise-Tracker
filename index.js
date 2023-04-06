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
  UserModel.findByIdAndUpdate(userID, {log: exerciseObj}, {new: true}).then((userExerciseData) => {
    console.log('Saving exercise ' + userExerciseData.description + ': Success...');
    let userExerciseObj = userExerciseData;
    userExerciseObj._id = userID;
    userExerciseData.username = "some username"
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
  UserModel.find().where('_id').all(req.params.id).then((usernameExerciseData) => {
    console.log('Query one user: Success...');
    json.res(usernameExerciseData);
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
