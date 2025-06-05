import nodemailer from 'nodemailer';

// Create email transporter with better error handling
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    logger: process.env.NODE_ENV === 'development', // Enable logging in development
  };

  console.log('Email config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user ? '***' : 'NOT_SET',
    pass: config.auth.pass ? '***' : 'NOT_SET',
  });

  return nodemailer.createTransport(config);
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email connection successful');
    return { success: true };
  } catch (error) {
    console.error('Email connection failed:', error);
    return { success: false, error };
  }
};

// Generate OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email with better error handling
export const sendOTPEmail = async (email: string, otp: string, name: string) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Email sending skipped.');
      return { success: false, error: 'Email credentials not configured' };
    }

    const transporter = createTransporter();

    // Verify connection before sending
    await transporter.verify();

    const mailOptions = {
      from: `"LocaList" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - LocaList',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LocaList</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Welcome to your local community platform</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${name}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for joining LocaList! To complete your registration, please verify your email address using the OTP below:
            </p>
            
            <div style="background: #f8f9ff; border: 2px dashed #667eea; border-radius: 10px; padding: 30px; margin: 30px 0; text-align: center;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Your Verification Code</h3>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #888; font-size: 14px; margin: 15px 0 0 0;">
                This code will expire in 10 minutes
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you didn't create an account with LocaList, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                Best regards,<br>
                The LocaList Team
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Send event approval notification
export const sendEventApprovalEmail = async (
  organizerEmail: string, 
  organizerName: string, 
  eventTitle: string
) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Community Pulse" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: organizerEmail,
    subject: '🎉 Your Event Has Been Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Event Approved!</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Community Pulse</p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${organizerName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! Your event "<strong>${eventTitle}</strong>" has been approved and is now live on Community Pulse.
          </p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #065f46; margin: 0 0 10px 0;">What's Next?</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li>Your event is now visible to community members</li>
              <li>Users can register and show interest</li>
              <li>You'll receive notifications about registrations</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Your Event
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Best regards,<br>
              The Community Pulse Team
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error };
  }
};

// Send admin notification for new event
export const sendAdminEventNotification = async (
  adminEmail: string, 
  eventTitle: string, 
  organizerName: string,
  eventId: number
) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Community Pulse" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: '🔔 New Event Pending Approval',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Event Pending</h1>
          <p style="color: #fef3c7; margin: 10px 0 0 0;">Community Pulse Admin</p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin: 0 0 20px 0;">New Event Submission</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            A new event "<strong>${eventTitle}</strong>" has been submitted by <strong>${organizerName}</strong> and is pending your approval.
          </p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">Action Required</h3>
            <p style="color: #a16207; margin: 0;">
              Please review and approve or reject this event in the admin panel.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
               style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Review Event
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Community Pulse Admin Panel
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return { success: false, error };
  }
}; 