// server.js
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import dbConnect from "./lib/dbConnect.js";
import { Comment, Team, Todo } from "./models/model.js";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"]
  }
});

// Socket connection handler
io.on("connection", async (socket) => {
  console.log(" New client connected:", socket.id);
  
  // Handle user joining rooms based on their userId
  socket.on("joinUserRoom", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    }
  });
  
  // Handle joining team rooms
  socket.on("joinTeamRoom", (teamId) => {
    if (teamId) {
      socket.join(`team:${teamId}`);
      console.log(`Socket ${socket.id} joined team room ${teamId}`);
    }
  });

  // Async DB connection with error handling
  try {
    await dbConnect();
    console.log("DB connected for socket event");
  } catch (error) {
    console.error(" DB connection error on socket connect:", error);
  }

  // Handle new comment event
  socket.on("addCommentToTodo", async (data) => {
    const { todoId, comment, teamId, userId } = data;
    
    try {
      // Find the todo
      const todo = await Todo.findById(todoId);
      if (!todo) {
        return socket.emit("error", {
          success: false,
          message: "Todo not found",
        });
      }
      
      // Create new comment
      const newcomment = new Comment({
        taskRef: todoId,
        onModel: "Todo",
        author: userId,
        content: comment,
      });
      
      // Save comment and update todo
      await newcomment.save();
      todo.comments.push(newcomment._id);
      await todo.save();
      
      // Find team and formatted comment
      const team = await Team.findById(teamId);
      const formatComment = await Comment.findById(newcomment._id)
        .populate("author", "username fullName email");
      
      // Emit to team room
      io.to(`team:${teamId}`).emit("commenttodoAdded", {
        success: true,
        comment: formatComment,
        todoId: todoId
      });
      
      // Also emit to sender for confirmation
      socket.emit("commentAdded", {
        success: true,
        message: "Comment added successfully"
      });
      
    } catch (error) {
      console.error("Error adding comment:", error);
      socket.emit("error", {
        success: false,
        message: "Failed to add comment",
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});