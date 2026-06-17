import { createMailTransporter } from "../../config/mail";
import { SendMailOptions } from "../common.type";
import { EMAIL_USERNAME } from "../../config/config";


export async function sendMail({to, subject, html, text, attachments}: SendMailOptions): Promise<void>{
  try {
    const transporter = await createMailTransporter();

    await transporter.sendMail({
      from: EMAIL_USERNAME,
      to,
      subject,
      html,
      text,
      attachments,
    });
  } catch (error) {
    logging.error('Email sending failed:', error);
    throw error;
  }

}