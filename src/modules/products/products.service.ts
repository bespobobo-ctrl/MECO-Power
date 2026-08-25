import fs from 'fs';
import path from 'path';
import { logger } from '../../config/logger';
import { supabase } from '../../config/supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

export interface Product {
  id: string;
  name: string;
  category: 'Solar Power Bank' | 'Solar Generator' | 'Solar Panel';
  capacity?: string;
  powerOutput?: string;
  descriptionUz: string;
  descriptionRu: string;
  descriptionEn: string;
  specsUz: string;
  specsRu: string;
  specsEn: string;
  priceUzS: number;
  imageUrl: string;
  protectionBadgeUz: string;
  protectionBadgeRu: string;
  protectionBadgeEn: string;
  inStockUzbekistan: boolean;
  urlPath: string;
}

export class ProductsService {
  private static isInitialized = false;

  private static defaultProducts: Product[] = [
    {
      id: 'prod-300wh',
      name: 'Meco 300Wh Solar Power Bank',
      category: 'Solar Power Bank',
      capacity: '300Wh',
      powerOutput: '300W Fast Charge',
      descriptionUz: 'Tashqi muhitda va lagerlarda foydalanish uchun mo\'ljallangan portativ quyosh zaryadlash moslamasi.',
      descriptionRu: 'Портативное солнечное зарядное устройство для использования на открытом воздухе и в кемпинге.',
      descriptionEn: 'Portable solar power bank designed for outdoor emergency use and camping.',
      specsUz: 'Tashqi muhit uchun | Ikki USB-C tezkor port | O\'rnatilgan MPPT va LiFePO4',
      specsRu: 'Для отдыха на природе | Двойной быстрой порт USB-C | Встроенный MPPT и LiFePO4',
      specsEn: 'Suitable for outdoor use | Dual USB-C Fast Charge | Built-in MPPT & LiFePO4',
      priceUzS: 3200000,
      imageUrl: '/images/bank_300wh.png',
      protectionBadgeUz: 'Qisqa tutashuv va xatoliqdan himoya',
      protectionBadgeRu: 'Защита от короткого замыкания',
      protectionBadgeEn: 'Short Circuit & Fault Protection',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/product/Meco-300Wh-Solar-Power-Bank.html',
    },
    {
      id: 'prod-1kwh',
      name: 'Meco 1kWh Solar Generator',
      category: 'Solar Generator',
      capacity: '1kWh',
      powerOutput: '1000W Pure Sine Wave',
      descriptionUz: 'Kichik maishiy texnika va ro\'zg\'or buyumlari uchun ixcham quyosh stansiyasi.',
      descriptionRu: 'Компактная солнечная электростанция для мелкой бытовой техники и приборов.',
      descriptionEn: 'Applied to small household appliances with 1000W continuous output.',
      specsUz: 'Kichik maishiy texnikalar uchun | 1000W AC Chiqish | GaN 92% Samaradorlik',
      specsRu: 'Для бытовой техники | Выход AC 1000Вт | Эффективность GaN 92%',
      specsEn: 'Applied to small household appliances | 1000W AC Output | GaN 92% Efficiency',
      priceUzS: 8900000,
      imageUrl: '/images/generator_1k.png',
      protectionBadgeUz: 'LiFePO4 8000+ Sikl',
      protectionBadgeRu: 'LiFePO4 8000+ Циклов',
      protectionBadgeEn: 'LiFePO4 8000+ Cycles',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/product/Meco-1kWh-Solar-Generator.html',
    },
    {
      id: 'prod-1kwh-pro',
      name: 'Meco 1kWh Pro Solar Generator',
      category: 'Solar Generator',
      capacity: '1kWh Pro',
      powerOutput: '1200W High Peak',
      descriptionUz: 'Chekka hududlar hamda kichik energiya saqlash joylari uchun Pro model.',
      descriptionRu: 'Модель Pro для отдаленных районов и небольших солнечных электростанций.',
      descriptionEn: 'Suitable for small-scale space solar power generators in remote areas.',
      specsUz: 'Kichik joylar va obyektlar uchun | Yuqori zichlikdagi akkumulyator',
      specsRu: 'Для небольших помещений | Батарея высокой плотности',
      specsEn: 'Suitable for small-scale space solar power generators | Compact High-Density',
      priceUzS: 10500000,
      imageUrl: '/images/generator_1k.png',
      protectionBadgeUz: 'Pro High-Density Battery',
      protectionBadgeRu: 'Pro High-Density Battery',
      protectionBadgeEn: 'Pro High-Density Battery',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/product/Meco-1kWh-Pro-Solar-Generator.html',
    },
    {
      id: 'prod-1k8wh',
      name: 'Meco 1.8kWh Solar Generator',
      category: 'Solar Generator',
      capacity: '1.8kWh',
      powerOutput: '1800W AC Output',
      descriptionUz: 'Kichik hajm va yuqori quvvatga ega quyosh stansiyasi.',
      descriptionRu: 'Солнечная электростанция с небольшим объемом и высокой мощностью.',
      descriptionEn: 'Suitable for small-scale space solar power generators with 1800W AC power.',
      specsUz: 'Kichik obyektlar va ofislar uchun | 1800W Sof sinus invertori',
      specsRu: 'Для офисов и объектов | Инвертор 1800Вт Чистая синусоида',
      specsEn: 'Suitable for small-scale space solar power generators | 1800W Pure Sine Inverter',
      priceUzS: 14200000,
      imageUrl: '/images/generator_1k.png',
      protectionBadgeUz: 'BMS Aqlli Nazorat',
      protectionBadgeRu: 'BMS Умный Контроль',
      protectionBadgeEn: 'BMS Smart Monitoring',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/product/Meco-1-8kWh-Solar-Generator.html',
    },
    {
      id: 'prod-2kwh',
      name: 'Meco 2kWh Solar Generator',
      category: 'Solar Generator',
      capacity: '2kWh',
      powerOutput: '2000W Continuous',
      descriptionUz: 'Butun xonadonni va sovutgich / maishiy uskunalarni elektr bilan ta\'minlaydi.',
      descriptionRu: 'Обеспечивает электроэнергией весь ваш дом и холодильник.',
      descriptionEn: 'Powers your entire household and refrigerator continuously.',
      specsUz: 'Butun xonadon uchun | 2000W AC Chiqish | Tezkor MPPT zaryadlash',
      specsRu: 'Для всего дома | Выход AC 2000Вт | Быстрая солнечная зарядка MPPT',
      specsEn: 'Powers your entire household | 2000W AC Output | Solar MPPT Fast Charging',
      priceUzS: 16800000,
      imageUrl: '/images/generator_3.6k.png',
      protectionBadgeUz: 'To\'liq Uy Avtonomiyasi',
      protectionBadgeRu: 'Полная Автономия Дома',
      protectionBadgeEn: 'Full Home Autonomy',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/product/Meco-2kWh-Solar-Generator.html',
    },
    {
      id: 'prod-3k6wh',
      name: 'Meco 3.6kWh Solar Generator',
      category: 'Solar Generator',
      capacity: '3.6kWh',
      powerOutput: '3000W Surge 6000W',
      descriptionUz: 'Tashqi sayohatlar, lager va favqulodda vaziyatlar uchun mukammal quvvat manbai.',
      descriptionRu: 'Идеальный источник питания для загородных путешествий, кемпинга и ЧС.',
      descriptionEn: 'Perfect for outdoor adventures, camping, and home emergency backup.',
      specsUz: 'Sayohat va lagerlar uchun | 3600Wh Ulkan sig\'im',
      specsRu: 'Для путешествий и кемпинга | Сверхемкость 3600Втч',
      specsEn: 'Perfect for outdoor adventures and camping | 3600Wh Ultra Capacity',
      priceUzS: 21000000,
      imageUrl: '/images/generator_3.6k.png',
      protectionBadgeUz: 'Sayohat va Lager Tayyor',
      protectionBadgeRu: 'Готов к кемпингу',
      protectionBadgeEn: 'Camping & Adventure Ready',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/product/Meco-3-6kWh-Solar-Generator.html',
    },
    {
      id: 'prod-3k6pro',
      name: 'Meco 3.6kWh Pro Solar Generator',
      category: 'Solar Generator',
      capacity: '3.6kWh Pro',
      powerOutput: '3600W GaN 92% Efficiency',
      descriptionUz: 'Zamonaviy xonadonlar uchun ishonchli va yuqori quvvatli energiya zaxirasi.',
      descriptionRu: 'Обеспечивает надежную высокую мощность для современных домохозяйств.',
      descriptionEn: 'Provides reliable high-power power support for modern households.',
      specsUz: 'Zamonaviy xonadonlar uchun | UN38.3 Xalqaro sertifikatlangan',
      specsRu: 'Для современных домов | Международный сертификат UN38.3',
      specsEn: 'Provides reliable high-power power support for modern households | UN38.3 Certified',
      priceUzS: 24500000,
      imageUrl: '/images/generator_3.6k.png',
      protectionBadgeUz: 'GaN 92% Konversiya',
      protectionBadgeRu: 'Конверсия GaN 92%',
      protectionBadgeEn: 'GaN 92% Conversion',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/product/Meco-3-6kWh-Pro-Solar-Generator.html',
    },
    {
      id: 'prod-5k4wh',
      name: 'Meco 5.4kWh Solar Generator',
      category: 'Solar Generator',
      capacity: '5.4kWh Heavy Duty',
      powerOutput: '5000W Continuous',
      descriptionUz: 'Oshxona, og\'ir maishiy texnika va ofis uskunalarini quvvatlantiruvchi yirik avtonom stansiya.',
      descriptionRu: 'Крупная электростанция для кухни, тяжелой бытовой техники и офисов.',
      descriptionEn: 'Including kitchen and office devices solar generator for total autonomy.',
      specsUz: 'Oshxona va ofis uskunalar uchun | 5400Wh Sig\'im',
      specsRu: 'Для кухни и офисов | Емкость 5400Втч',
      specsEn: 'Including kitchen and office devices solar generator | 5400Wh Storage Capacity',
      priceUzS: 38000000,
      imageUrl: '/images/generator_5.4k.png',
      protectionBadgeUz: 'Yuqori Quvvatli 5.4kWh',
      protectionBadgeRu: 'Высокая Мощность 5.4кВтч',
      protectionBadgeEn: 'Heavy Duty 5.4kWh',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/product/Meco-5-4kWh-Solar-Generator.html',
    },
    {
      id: 'prod-f200w',
      name: 'Meco F200W Solar Panel',
      category: 'Solar Panel',
      capacity: '200W Foldable',
      powerOutput: '200W Mono-crystalline',
      descriptionUz: 'N-type ikki tomonlama shishali yuqori samaradorlikka ega buklanuvchan panel.',
      descriptionRu: 'Высокоэффективный складной двусторонний стеклянный модуль N-типа.',
      descriptionEn: 'N-type Bifacial Double Glass High Efficiency Mono Module.',
      specsUz: 'N-type Ikki tomonlama oyna | Suv va tirnalishga chidamli',
      specsRu: 'N-type Двустороннее стекло | Защита от воды и царапин',
      specsEn: 'N-type Bifacial Double Glass High Efficiency Mono Module | Scratch & Water Resistant',
      priceUzS: 2100000,
      imageUrl: '/images/panel_f200w.png',
      protectionBadgeUz: 'N-Type Ikki Tomonlama Oyna',
      protectionBadgeRu: 'N-Type Двустороннее Стекло',
      protectionBadgeEn: 'N-Type Bifacial Double Glass',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/meco-f200w-solar-panel.html',
    },
    {
      id: 'prod-580w',
      name: 'Meco 580W Solar Panel',
      category: 'Solar Panel',
      capacity: '580W High Efficiency',
      powerOutput: '580W Peak Power',
      descriptionUz: 'Barqaror va toza energiya beruvchi yuqori unumdorlikdagi quyosh paneli.',
      descriptionRu: 'Высокопроизводительная солнечная панель для стабильной чистой энергии.',
      descriptionEn: 'Stable clean energy solutions with high efficiency monocrystalline cell.',
      specsUz: 'Barqaror toza energiya | Zarbaga chidamli chiniqtirilgan oyna',
      specsRu: 'Стабильная чистая энергия | Закаленное стекло',
      specsEn: 'Stable clean energy solutions | Double Glass Tempered Protection',
      priceUzS: 2800000,
      imageUrl: '/images/panel_620w.png',
      protectionBadgeUz: 'Barqaror Toza Energiya',
      protectionBadgeRu: 'Стабильная Чистая Энергия',
      protectionBadgeEn: 'Stable Clean Energy Module',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/meco-580w-solar-panel.html',
    },
    {
      id: 'prod-620w',
      name: 'Meco 620W Solar Panel',
      category: 'Solar Panel',
      capacity: '620W Maximum Power',
      powerOutput: '620W Mono N-Type',
      descriptionUz: 'Samaradorligi oshirilgan N-type ikkitomonlama shisha monokristall modul.',
      descriptionRu: 'Эффективный двустекольный мономодуль N-типа.',
      descriptionEn: 'Efficient N-type double glass mono module with high conversion efficiency.',
      specsUz: 'N-type ikkitomonlama oyna | IP68 Suv o\'tkazmaydigan korpus',
      specsRu: 'Двустекольный модуль N-типа | Водонепроницаемый IP68',
      specsEn: 'Efficient N-type double glass module | Waterproof IP68 Junction Box',
      priceUzS: 3100000,
      imageUrl: '/images/panel_620w.png',
      protectionBadgeUz: 'Samarali N-Type Oyna',
      protectionBadgeRu: 'Эффективное Стекло N-Type',
      protectionBadgeEn: 'Efficient N-Type Double Glass',
      inStockUzbekistan: true,
      urlPath: 'https://www.mecopower.com/meco-620w-solar-panel.html',
    },
  ];

  private static products: Product[] = [];

  private static initPersistence() {
    if (this.isInitialized && this.products.length > 0) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(PRODUCTS_FILE)) {
        const fileContent = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.products = parsed;
          this.isInitialized = true;
          logger.info(`📦 Loaded ${parsed.length} persisted products from disk (${PRODUCTS_FILE})`);
          return;
        }
      }
    } catch (err: any) {
      logger.warn(`File persistence load note: ${err.message}`);
    }

    // Fallback to default
    this.products = [...this.defaultProducts];
    this.saveToDisk();
    this.isInitialized = true;
  }

  private static saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(this.products, null, 2), 'utf-8');
      logger.info(`💾 Products catalog saved to disk (${PRODUCTS_FILE})`);
    } catch (err: any) {
      logger.warn(`File persistence save note: ${err.message}`);
    }

    // Async save to Supabase system_config
    try {
      supabase.from('system_config').upsert({
        key: 'products_catalog',
        value: this.products,
        updated_at: new Date().toISOString()
      }).then(() => {});
    } catch (e) {}
  }

  async getAllProducts() {
    ProductsService.initPersistence();
    return ProductsService.products;
  }

  async getProductById(id: string) {
    ProductsService.initPersistence();
    return ProductsService.products.find((p) => p.id === id) || null;
  }

  async updateProductsBatch(updatedList: Partial<Product>[]) {
    ProductsService.initPersistence();

    updatedList.forEach((item) => {
      if (!item.id) return;
      const index = ProductsService.products.findIndex((p) => p.id === item.id);
      if (index !== -1) {
        ProductsService.products[index] = {
          ...ProductsService.products[index],
          ...item,
        };
      }
    });

    ProductsService.saveToDisk();
    return ProductsService.products;
  }
}
