require("dotenv").config()
const express = require("express");
const app = express();
const socket = require("socket.io");
const cloudinary = require("cloudinary");
const color = require("colors");
const cors = require("cors");
const { get_Current_User, user_Disconnect, join_User } = require("./dummyuser");

// no need db connection since its not been used
// require("./connection")

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});


app.use(express());

const port = 8000;

app.use(cors());

var server = app.listen(
  port,
  console.log(
    `Server is running on the port no: ${(port)} `
      .green
  )
);

const io = socket(server);

//initializing the socket io connection 
io.on("connection", (socket) => {
  //for a new user joining the room
  console.log("connected user with id",socket.id,)
  socket.on("joinRoom", ({username,roomname}) => {
    console.log(username,roomname)
    // console.log(data.username)
    //* create user
  
    const p_user = join_User(socket.id, username, roomname);
    console.log(socket.id, "=id");
    socket.join(p_user.room);

    //display a welcome message to the user who have joined a room
    socket.emit("message", {
      userId: p_user.id,
      username: p_user.username,
      text: `Welcome ${p_user.username}`,
    });

    

    //displays a joined room message to all other room users except that particular user
    socket.broadcast.to(p_user.room).emit("message", {
      userId: p_user.id,
      online:true,
      username: p_user.username,
      text: `${p_user.username} has joined the chat`,
    });
  });

  //user sending message
  socket.on("chat", ({message,image}) => {
    console.log(message)
    //gets the room user and the message sent
    const p_user = get_Current_User(socket.id);
    // console.log(p_user)
    io.to(p_user.room).emit("message", {
      userId: p_user.id,
      username: p_user.username,
      text: message,
      ...(image&&{image})
    });
  });
//   socket.on('image',(image) => {
//     console.log(image)
//     // image should be received in base64 or buffer stream
//     // convert to normal image and store to cloudinary or store directly the base64 in db
// let convertedImage = new Buffer(image,'base64')

//     // cloudinary.v2.uploader.upload(convertedImage,{folder:"mtechHub"}).then(res=>{
//     //     // console.log(res)
//     //     // console.log(res.url)
//     //     // the url to be stored in db /
//     //     // store the image path in db and sent to user the path that is stored

//     // })
//     // io.to(p_user.room).emit("message", {
//     //     userId: p_user.id,
//     //     username: p_user.username,
//     //     text: text,
//     //   });
// });
  //when the user exits the room
  socket.on("disconnect", () => {
    //the user is deleted from array of users and a left room message displayed
    const p_user = user_Disconnect(socket.id);

    if (p_user) {
      io.to(p_user.room).emit("message", {
        userId: p_user.id,
        username: p_user.username,
        online:false,
        text: `${p_user.username} has left the room`,
      });
    }
  });
});