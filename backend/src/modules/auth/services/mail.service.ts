import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"MentorQ" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Your MentorQ Verification Code',
      text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
      html: `<b>Your OTP is: ${otp}</b><p>It expires in 10 minutes.</p>`,
    });
  }
}
