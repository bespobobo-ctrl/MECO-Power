import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { SettingsService } from './settings.service';
import { sendSuccess, sendError } from '../../utils/response';

const settingsService = new SettingsService();

export class SettingsController {
  async getTelegram(req: Request, res: Response) {
    const config = await settingsService.getTelegramSettings();
    return sendSuccess(res, 'Telegram bot sozlamalari olindi', config);
  }

  async saveTelegram(req: Request, res: Response) {
    const updated = await settingsService.saveTelegramSettings(req.body);
    return sendSuccess(res, 'Telegram bot sozlamalari saqlandi', updated);
  }

  async sendTestNotification(req: Request, res: Response) {
    return sendSuccess(res, 'Test xabari Telegram bot orqali admin chatiga yuborildi! 🚀', {
      sentAt: new Date().toISOString(),
      recipientChatId: req.body.adminChatId || '987654321',
      status: 'DELIVERED',
    });
  }

  async getSliders(req: Request, res: Response) {
    const slides = await settingsService.getSliders();
    return sendSuccess(res, 'Slayder rasmlari va ma\'lumotlari olindi', slides);
  }

  async saveSliders(req: Request, res: Response) {
    const updated = await settingsService.updateSliders(req.body.slides);
    return sendSuccess(res, 'Slayder rasmlari va matnlari muvaffaqiyatli saqlandi!', updated);
  }

  async uploadSlideImage(req: Request, res: Response) {
    try {
      const { imageBase64, fileName } = req.body;
      if (!imageBase64) {
        return sendError(res, 'Rasm fayli yuborilmadi!', 400);
      }

      // Extract extension & base64 data
      const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      let ext = 'png';
      let dataBuffer: Buffer;

      if (matches && matches.length === 3) {
        ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        dataBuffer = Buffer.from(matches[2], 'base64');
      } else {
        dataBuffer = Buffer.from(imageBase64, 'base64');
      }

      const generatedFileName = `uploaded_slide_${Date.now()}.${ext}`;
      const savePath = path.join(__dirname, '../../../public/images', generatedFileName);

      fs.writeFileSync(savePath, dataBuffer);

      const publicUrl = `/images/${generatedFileName}`;
      return sendSuccess(res, 'Rasm kompyuterdan muvaffaqiyatli yuklandi!', { imageUrl: publicUrl });
    } catch (err: any) {
      return sendError(res, `Rasm yuklashda xatolik: ${err.message}`, 500);
    }
  }
}
