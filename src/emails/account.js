const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRIP_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'an.drshid1rod@gmail.com',
        subject: 'Thanks for joining in.',
        text: `Welcome to the app, ${name}.`
    })
}

const sendAccountDeleteEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'an.drshid1rod@gmail.com',
        subject: 'Account cancelled.',
        text: `It's just say goodbye my friend, ${name}.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendAccountDeleteEmail
}