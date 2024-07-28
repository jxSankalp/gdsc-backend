const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "Gmail", 
  host:"smtp.gmail.com",
  auth: {
    user: "altcracker890@gmail.com", 
    pass: "eckq nvki pcyg jwqu", 
  },
});

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from:{
      name:"Sankalp Jain",
      address: "altcracker890@gmail.com"  
    },
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
