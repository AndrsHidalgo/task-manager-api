const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middlewares/auth')
const { sendWelcomeEmail, sendAccountDeleteEmail } = require('../emails/account')
const router = new express.Router()

const upload = multer({
    limits: {
        fileSize: 1048576
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return cb(new Error('Please upload an image file(jpg, jpeg, png)'))
        
        cb(undefined, true)
    }
})

router.get('/users', async (req, res) => {
    try {
        const users = await User.find({})

        if(!users)
            return res.status(404).send()

        res.status(200).send(users)
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        const token = await user.generateAuthToken()

        await user.save()
        
        sendWelcomeEmail(user.email, user.name)

        res.status(201).send({ user, token })
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body)

        const token = await user.generateAuthToken()

        await user.save()
        
        res.status(200).send({ user, token })
    } catch (error) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)

        await req.user.save()

        res.status(200).send()
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save()

        res.status(200).send()
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user)
})  

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
        .resize({ width: 200, height: 200}).png().toBuffer()

    req.user.avatar = buffer

    await req.user.save()

    res.status(200).send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        
        if (!user || !user.avatar)
            throw new Error()

        res.set('Content-type', 'image/png')

        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined

        await req.user.save()

        res.status(200).send(user)
    } catch (error) {
        res.status(500).send()
    }
})

router.put('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    allowedUpdates = ['name', 'email', 'age', 'password']
    isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation)
        return res.status(400).send({
            'error': 'Invalid updates.'
        })

    try {
        updates.forEach(update => req.user[update] = req.body[update])

        const user = await req.user.save()

        res.status(200).send(user)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()

        sendAccountDeleteEmail(req.user.email, req.user.name)
        
        res.status(200).send(user)
    } catch (error) {
        res.status(500).send()
    }
})

module.exports = router
