const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: {type: String, required: true, minlength: 3},
    name: String,
    passwordHash: String,
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog'
        }
    ]
})

userSchema.set('toJSON', {
    transform: (document, returned) => {
        returned.id = returned._id.toString()
        delete returned._id
        delete returned.__v
        delete returned.passwordHash
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User