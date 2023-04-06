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
  log: []
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

// app.post('api/users/:id/exercises', function(req, res) {
//   console.log("post exercise");
  // let uid = req.params.id;
  // let description = req.body.description;
  // let duration = req.body.duration;
  // let date = req.body.date;
  // let newExerciseObj = {
  //   description: description,
  //   duration: duration,
  //   date: date
  // }
  // createAndAddExercisesTo(uid, newExerciseObj, res);
// });

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
  console.log('create and add exercise');
  UserModel.findByIdAndUpdate(userID, {log: exerciseObj}, {new: true}).then((userExerciseData) => {
    console.log('Saving exercise ' + userExerciseData.description + ': Success...');
    let userExerciseObj = userExerciseData;
    userExerciseObj._id = userID;
    userExerciseObj.username = "some username"
    response.json(userExerciseObj);
    // response.redirect('https://fcc-exercise-tracker.dlee923.repl.co/api/users/' + userID + '/exercises');
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
    logError("Query users", err, res);
  })
});

app.get('/api/users/:id/exercises', function(req, res) {
  UserModel.findById(req.params.id).then((usernameExerciseData) => {
    console.log('Query user exercises: Success...');
    console.log(usernameExerciseData);
    res.json(usernameExerciseData);
  }).catch((err) => {
    logError('Query user exercises', err, res);
  })
});

function logError(fxPurpose, err, response) {
  console.log('------------ ' + fxPurpose + ': Error... ------------');
  console.log(err)
  console.log('------------ Error ------------');
  response.json({error: 'invalid request'})
}

