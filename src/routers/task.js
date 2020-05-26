const express = require('express')
const Task = require('../models/task')
const auth = require("../middlewares/auth")
const router = new express.Router()

router.get('/tasks', auth, async (req, res) => {
    const match = {}, sort = {}

    try {
        if(req.query.completed)
            match.completed = req.query.completed === 'true' ? true : false

        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        res.status(200).send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({ 
        ...req.body, 
        owner: req.user._id 
    })

    try {
        await task.save() 

        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {    
    try {
        const task = await Task.findOne({ 
            _id: req.params.id, 
            owner: req.user._id 
        })

        if(!task) 
            return res.status(404).send()

        res.status(200).send(task)
    } catch (error) {
        res.status(500).send()
    }
})

router.put('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    allowedUpdates = ['description', 'completed']
    isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation)
        return res.status(400).send({
            'error': 'Invalid updates.'
        })
    
    try {
        const task = await Task.findOne({ 
            _id: req.params.id, 
            owner: req.user._id 
        })

        if(!task)
            return res.status(404).send()

        updates.forEach(update => task[update] = req.body[update])

        await task.save()
        
        res.status(200).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id, 
            owner: req.user._id 
        })
        
        if(!task)
            return res.status(404).send()

        res.status(200).send(task)
    } catch (error) {
        res.status(500).send()
    }
})

module.exports = router