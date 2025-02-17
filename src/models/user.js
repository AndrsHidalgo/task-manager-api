const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim:true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) 
                throw new Error('Email is invalid.')
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) 
                throw new Error('Too few age.')
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes('password')) 
                throw new Error('Password cannot contain "password".')
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})

schema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

schema.methods.toJSON = function() {
    const userObj = this.toObject()

    delete userObj.password
    delete userObj.tokens
    delete userObj.avatar

    return userObj
}

schema.methods.generateAuthToken = async function() {
    const token =  jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET)

    this.tokens = this.tokens.concat({ token })

    return token
}

schema.statics.findByCredentials = async ({ email, password }) => {
    const user = await User.findOne({ email })

    if(!user)
        throw new Error('Unable to login')

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch)
        throw new Error('Unable to login')

    return user
}

schema.pre('save', async function(next) {
    if(this.isModified('password'))
        this.password = await bcrypt.hash(this.password, 8)

    next()
})

schema.pre('remove', async function(next) {
    await Task.deleteMany({ owner: this._id })

    next()
})

const User = mongoose.model('User', schema)

module.exports = User
