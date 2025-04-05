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
app.get("/", (req, res) => {
  res.send("Welcome to the homepage!");
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
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
      const formatComment = await Comment.findById(newcomment._id).populate(
        "author",
        "username fullName email"
      );

      // Emit to team room
      io.to(`team:${teamId}`).emit("commenttodoAdded", {
        success: true,
        comment: formatComment,
        todoId: todoId,
      });

      // Also emit to sender for confirmation
      socket.emit("commentAdded", {
        success: true,
        message: "Comment added successfully",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      socket.emit("error", {
        success: false,
        message: "Failed to add comment",
      });
    }
  });

  socket.on("editTodoComment", async (data) => {
    const { todoId, editContent, teamId, userId, commentId } = data;

    try {
      // Validate inputs
      if (!todoId || !editContent || !teamId || !userId || !commentId) {
        return socket.emit("error", {
          success: false,
          message: "Missing required fields",
        });
      }
      // Find the comment first
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return socket.emit("error", {
          success: false,
          message: "Comment not found",
        });
      }

      // Check if user is the comment author
      if (comment.author.toString() !== userId.toString()) {
        return socket.emit("error", {
          success: false,
          message: "You are not the author of this comment",
        });
      }

      // Verify todo exists
      const todo = await Todo.findById(todoId);
      if (!todo) {
        return socket.emit("error", {
          success: false,
          message: "Todo not found",
        });
      }

      // Update comment content
      comment.content = editContent;
      comment.updatedAt = new Date();
      await comment.save();

      // Get populated comment for response
      const formattedComment = await Comment.findById(commentId).populate(
        "author",
        "username fullName email"
      );

      // Emit to team room
      io.to(`team:${teamId}`).emit("todoCommentEdited", {
        success: true,
        comment: formattedComment,
        todoId: todoId,
      });

      // Also emit to sender for confirmation
      socket.emit("TodocommentEditSuccess", {
        success: true,
        message: "Comment edited successfully",
      });
    } catch (error) {
      console.error("Error editing comment:", error);
      socket.emit("error", {
        success: false,
        message: "Failed to edit comment",
        error: error.message,
      });
    }
  });

  socket.on("deleteTodoComment", async (data) => {
    const { todoId, teamId, userId, commentId } = data;
    
    try {
      // Validate inputs
      if (!todoId || !teamId || !userId || !commentId) {
        return socket.emit("error", {
          success: false,
          message: "Missing required fields",
        });
      }
      
      // Find the comment first
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return socket.emit("error", {
          success: false,
          message: "Comment not found",
        });
      }
      
      // Check if user is the comment author
      if (comment.author.toString() !== userId.toString()) {
        return socket.emit("error", {
          success: false,
          message: "You are not the author of this comment",
        });
      }
      
      // Verify todo exists
      const todo = await Todo.findById(todoId);
      if (!todo) {
        return socket.emit("error", {
          success: false,
          message: "Todo not found",
        });
      }
      
      // Remove comment from the todo's comments array
      if (todo.comments && todo.comments.includes(commentId)) {
        todo.comments = todo.comments.filter(id => id.toString() !== commentId.toString());
        await todo.save();
      }
      
      // Delete the comment document
      await Comment.findByIdAndDelete(commentId);
      
      // Emit to team room
      io.to(`team:${teamId}`).emit("todoCommentDeleted", {
        success: true,
        commentId: commentId,
        todoId: todoId,
      });
      
      // Also emit to sender for confirmation
      socket.emit("commentDeleteSuccess", {
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      socket.emit("error", {
        success: false,
        message: "Failed to delete comment",
        error: error.message,
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
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
