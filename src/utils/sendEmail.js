import { MailtrapClient } from "mailtrap";

const sendMail = async (email, otp) => {
  const mailtrapClient = new MailtrapClient({
    token: process.env.MAILTRAP_API_KEY,
  });

  const sender = {
    email: "mailtrap@demomailtrap.com",
    name: "Mailtrap Test",
  };
  const recipient = [
    {
      email: "gauravkharalgk@gmail.com",
    },
  ];

  const response = await mailtrapClient.send({
    from: sender,
    to: recipient,
    subject: "OTP",
    text: `Your OTP is ${otp}`,
    category: "Integration Test",
  });

  return response;
};

export { sendMail };
