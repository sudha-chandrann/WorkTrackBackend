import mongoose, { Schema } from "mongoose";


// User Schema (renamed from Client for clarity)
const userSchema = new Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    username: {
        type: String,
        unique: true,
        required: [true, "Username is required"],
        lowercase: true,
        trim: true,
        index: true,
        minlength: [3, "Username should be at least 3 characters"]
    },
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password should be at least 8 characters"]
    },
    refreshToken: {
        type: String
    },
    projects: [{
        type: Schema.Types.ObjectId,
        ref: 'Project'
    }],
    inbox: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    teams: [{
        type: Schema.Types.ObjectId,
        ref: 'Team'
    }],
    passwordResetCode:{
        type:String
    },
    passwordResetExpires: {
        type: Date
    },

}, { timestamps: true });




// Todo Schema
const todoSchema = new Schema({
    title: {
        type: String,
        required: [true, "Task title is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ["to-do", "in-progress", "completed", "blocked"],
        default: "to-do"
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    priority: {
        type: String,
        enum: ["high", "medium", "low"],
        default: "medium"
    },
    dueDate: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    attachments: [{
        name: String,
        url: String,
        type: String
    }],
    subtasks: [{
        type: Schema.Types.ObjectId,
        ref: "Subtask"
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }],
}, { timestamps: true });

// Subtask Schema
const subtaskSchema = new Schema({
    title: {
        type: String,
        required: [true, "Subtask title is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ["to-do", "in-progress", "completed", "blocked"],
        default: "to-do"
    },
    parentTask: {
        type: Schema.Types.ObjectId,
        ref: "Todo",
        required: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    priority: {
        type: String,
        enum: ["high", "medium", "low"],
        default: "medium"
    },
    dueDate: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }]
}, { timestamps: true });

// Team Schema
const teamSchema = new Schema({
    name: {
        type: String,
        required: [true, "Team name is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    members: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member"
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    projects: [{
        type: Schema.Types.ObjectId,
        ref: 'Project'
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });

// Project Schema
const projectSchema = new Schema({
    name: {
        type: String,
        required: [true, "Project name is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    icon: {
        type: String,
        default: "📝"
    },
    color: {
        type: String,
        default: "#3498db"
    },
    isPersonal: {
        type: Boolean,
        default: true
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: "Team"
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ["admin", "member", "viewer"],
            default: "member"
        }
    }],
    todos: [{
        type: Schema.Types.ObjectId,
        ref: "Todo"
    }],
}, { timestamps: true });

// Comment Schema
const commentSchema = new Schema({
    content: {
        type: String,
        required: [true, "Comment content is required"],
        trim: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    taskRef: {
        type: Schema.Types.ObjectId,
        refPath: 'onModel',
        required: true
    },
    onModel: {
        type: String,
        required: true,
        enum: ['Todo', 'Subtask']
    },
    attachments: [{
        name: String,
        url: String,
        type: String
    }],
    mentions: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        isRead: {
            type: Boolean,
            default: false
        }
    }]
}, { timestamps: true });


const notificationSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: ["assignment", "mention", "comment", "deadline", "invitation", "completion"],
        required: true
    },
    entityType: {
        type: String,
        enum: ["todo", "subtask", "project", "team", "comment"],
        required: true
    },
    entityId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String
    }
}, { timestamps: true });

// Export all models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema);
export const Subtask = mongoose.models.Subtask || mongoose.model('Subtask', subtaskSchema);
export const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);
export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);