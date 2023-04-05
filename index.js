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
  username: String
});

const exerciseSchema = new mongoose.Schema({
  uid: String,
  username: String,
  description: {type: String, require: true},
  duration: {type: Number, require: true},
  date: Date
});

// MongoDB Models
const UserModel = mongoose.model('UserModel', userSchema);
const ExerciseModel = mongoose.model('ExerciseModel', exerciseSchema);

function createAndSaveNewUser(username) {
  let newUser = UserModel({
    username: username
  });
  newUser.save().then((newUserData) => {
    console.log('Saving new user ' + newUserData.username + ': Success...')    
  }).catch((err) => {
    console.log('Saving new user ' + username + ': Error...')
  })
}

function createAndAddExercisesTo(userID, exerciseObj) {
  exerciseObj.save().then((exerciseData) => {
    console.log('Saving exercise ' + exerciseData.description + ': Success...')    
  }).catch((err) => {
    console.log('Saving exercise ' + exerciseObj.description + ': Error...')
  })
}

// enable bodyparser
app.use('/', bodyParser.urlencoded({ extended: false }));

// post API endpoints
app.post('/api/users', function(req, res) {
  let newUsername = req.body.username;
  createAndSaveNewUser(newUsername);
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
  createAndAddExercisesTo(uid, newExerciseObj);
});

// get API endpoints
app.get('/api/users', function(req, res) {
  UserModel.find().then((usernameData) => {    
    console.log('Query users: Success...');
    res.json({users: usernameData});
  }).catch((err) => {
    console.log('------------ Query users: Error... ------------');
    console.log(err)
    console.log('------------ Error ------------');
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
