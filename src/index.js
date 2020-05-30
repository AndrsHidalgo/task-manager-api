const app = require('./app')

const port = process.env.PORT

/**Server UP!*/
app.listen(port, () => {
    console.log(`Server is up on port ${ port }`)
})     