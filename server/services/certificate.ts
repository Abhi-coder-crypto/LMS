import { storage } from '../storage';

export class CertificateService {
  async generateCertificate(userId: string, courseId: string): Promise<string> {
    // Check if user has completed the course
    const courseProgress = await storage.getUserCourseProgress(userId, courseId);
    const course = await storage.getCourse(courseId);
    const user = await storage.getUser(userId);

    if (!course || !user) {
      throw new Error('Course or user not found');
    }

    // Get all modules in the course
    const modules = await storage.getModulesByCourse(courseId);
    
    // Check if all modules are completed
    const completedModules = courseProgress.filter(p => p.moduleId && p.isCompleted);
    const requiredModules = modules.length;

    if (completedModules.length < requiredModules) {
      throw new Error('Course not completed yet');
    }

    // Create certificate
    const certificate = await storage.createCertificate(userId, courseId);

    // Award XP for course completion
    await storage.updateUserXP(userId, course.xpReward || 500);

    // Check for course completion achievement
    await this.checkCourseCompletionAchievements(userId, course.level);

    return certificate.certificateNumber;
  }

  private async checkCourseCompletionAchievements(userId: string, courseLevel: string): Promise<void> {
    const achievements = await storage.getAchievements();
    
    // Find relevant achievement based on course level
    const levelAchievements = achievements.filter(a => 
      a.name.toLowerCase().includes(courseLevel.toLowerCase()) ||
      a.name.toLowerCase().includes('completion')
    );

    for (const achievement of levelAchievements) {
      try {
        await storage.unlockAchievement(userId, achievement.id);
        
        // Award XP for achievement
        if (achievement.xpReward) {
          await storage.updateUserXP(userId, achievement.xpReward);
        }
      } catch (error) {
        // Achievement might already be unlocked, ignore error
        console.log('Achievement already unlocked or error:', error);
      }
    }
  }

  async verifyCertificate(certificateNumber: string) {
    return await storage.verifyCertificate(certificateNumber);
  }

  generateCertificateHTML(certificate: any): string {
    const { user, course, certificateNumber, issuedAt } = certificate;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate of Completion</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .certificate {
            background: white;
            padding: 60px;
            border: 10px solid #1a365d;
            border-radius: 20px;
            text-align: center;
            max-width: 800px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header { color: #1a365d; font-size: 48px; font-weight: bold; margin-bottom: 20px; }
          .subheader { color: #4a5568; font-size: 24px; margin-bottom: 40px; }
          .recipient { font-size: 36px; color: #2d3748; margin: 30px 0; font-weight: bold; }
          .course { font-size: 28px; color: #1a365d; margin: 20px 0; }
          .date { color: #4a5568; font-size: 18px; margin-top: 40px; }
          .certificate-number { color: #718096; font-size: 14px; margin-top: 20px; }
          .seal { 
            width: 100px; 
            height: 100px; 
            background: #1a365d; 
            border-radius: 50%; 
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">CERTIFICATE OF COMPLETION</div>
          <div class="subheader">DigitioHub Academy</div>
          
          <div style="margin: 40px 0;">
            <div style="font-size: 20px; color: #4a5568;">This is to certify that</div>
            <div class="recipient">${user.firstName} ${user.lastName}</div>
            <div style="font-size: 20px; color: #4a5568;">has successfully completed</div>
            <div class="course">${course.title}</div>
            <div style="font-size: 18px; color: #4a5568;">${course.level.toUpperCase()} LEVEL</div>
          </div>
          
          <div class="seal">DH</div>
          
          <div class="date">Issued on ${new Date(issuedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          
          <div class="certificate-number">
            Certificate Number: ${certificateNumber}<br>
            Verify at: ${certificate.verificationUrl}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const certificateService = new CertificateService();
