const nodemailer = require("nodemailer");

const sendEmail = async options => {

    let testAccount = await nodemailer.createTestAccount();

    // 1.) Create a transporter
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: 'reginald44@ethereal.email',
            pass: 'tKBE8GYpYmNVMwTN4v',
        }
    });

    // 2.) Define the email options
    const mailOptions = {
        from: 'Aniruddha Das <foo@example.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    // // 3.) Actually send the email
    await transporter.sendMail(mailOptions);
}


module.exports = sendEmail;