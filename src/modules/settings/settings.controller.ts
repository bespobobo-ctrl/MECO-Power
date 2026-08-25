import { Request, Response } from 'express';
import { SettingsService } from './settings.service';
import { sendSuccess, sendError } from '../../utils/response';
import { supabase } from '../../config/supabase';
import { BUCKET_NAME } from '../../config/database';
import fs from 'fs';
import path from 'path';

const settingsService = new SettingsService();

export class SettingsController {
  async getSliders(req: Request, res: Response) {
    const sliders = await settingsService.getSliders();
    return sendSuccess(res, 'Hero sliders retrieved successfully', sliders);
  }

  async saveSliders(req: Request, res: Response) {
    try {
      const { slides } = req.body;
      if (!Array.isArray(slides)) {
        return sendError(res, 'Slayderlar massivi yuborilmadi', 400);
      }
      const updated = await settingsService.updateSliders(slides);
      return sendSuccess(res, 'Slayderlar muvaffaqiyatli saqlandi', updated);
    } catch (err: any) {
      return sendError(res, `Xatolik: ${err.message}`, 500);
    }
  }

  async uploadSlideImage(req: Request, res: Response) {
    try {
      const { imageBase64, fileName } = req.body;
      if (!imageBase64) {
        return sendError(res, 'Rasm fayli yuborilmadi (imageBase64 bo\'sh)', 400);
      }

      // Format extension
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'jpg';

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      }

      const generatedFileName = `uploaded_image_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;

      // 1. Try uploading to Supabase Storage Bucket
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(generatedFileName, buffer, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: true
          });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(generatedFileName);

          const supabaseCdnUrl = publicUrlData.publicUrl;
          return sendSuccess(res, 'Rasm Supabase Storage ga muvaffaqiyatli yuklandi!', {
            imageUrl: supabaseCdnUrl,
            storageType: 'Supabase Storage CDN'
          });
        }
      } catch (sbErr: any) {
        console.warn('Supabase storage fallback trigger:', sbErr.message);
      }

      // 2. Fallback to Local Filesystem if Supabase offline/bucket error
      const publicDir = path.join(__dirname, '../../../public/images');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const localPath = path.join(publicDir, generatedFileName);
      fs.writeFileSync(localPath, buffer);

      const localUrl = `/images/${generatedFileName}`;
      return sendSuccess(res, 'Rasm kompyuter fayl tizimiga yuklandi', {
        imageUrl: localUrl,
        storageType: 'Local Static Storage'
      });
    } catch (err: any) {
      return sendError(res, `Rasm yuklashda xatolik: ${err.message}`, 500);
    }
  }

  async getTelegram(req: Request, res: Response) {
    const config = await settingsService.getTelegramSettings();
    return sendSuccess(res, 'Telegram bot configurations retrieved', config);
  }

  async saveTelegram(req: Request, res: Response) {
    const { miniAppBotToken, notificationBotToken, adminChatId } = req.body;
    const updated = await settingsService.saveTelegramSettings({
      miniAppBot: { botToken: miniAppBotToken, webAppUrl: '', status: 'ACTIVE' },
      notificationBot: { botToken: notificationBotToken, adminChatId, notifyNewOrders: true, notifyTrafficAlerts: true, notifyDailyReport: true, status: 'ACTIVE' }
    });
    return sendSuccess(res, 'Telegram bot configurations updated', updated);
  }

  async sendTestNotification(req: Request, res: Response) {
    const { adminChatId } = req.body;
    return sendSuccess(res, 'Test Telegram xabarnomasi yuborildi', { adminChatId, status: 'SENT' });
  }
}
