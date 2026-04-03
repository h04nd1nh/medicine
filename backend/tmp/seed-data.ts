import * as dotenv from 'dotenv';
dotenv.config();

import { createConnection } from 'typeorm';
import { ViThuoc } from '../src/models/vi-thuoc.model';
import { CongDung } from '../src/models/cong-dung.model';

async function seed() {
    const conn = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
          rejectUnauthorized: true,
          ca: process.env.CA_CERTIFICATE,
        },
        entities: [ViThuoc, CongDung],
        synchronize: true,
    });

    console.log('Connected to Aiven DB. Seeding CongDung from vi_thuoc...');
    const vtRepo = conn.getRepository(ViThuoc);
    const cdRepo = conn.getRepository(CongDung);

    const vts = await vtRepo.find();

    // Seed From vi_thuoc.công dụng
    const cdMap = new Map<string, string>(); // text -> note
    vts.forEach(vt => {
        if (!vt.cong_dung) return;
        const entries = vt.cong_dung.split('; ').filter(Boolean);
        entries.forEach(e => {
            const parts = e.split('||');
            const t = (parts[0] || '').trim();
            const n = (parts[1] || '').trim();
            if (t) cdMap.set(t, n || cdMap.get(t) || '');
        });
    });

    for (const [text, note] of cdMap.entries()) {
        const exist = await cdRepo.findOneBy({ ten_cong_dung: text });
        if (!exist) {
            await cdRepo.save(cdRepo.create({ ten_cong_dung: text, ghi_chu: note }));
            console.log(`+ Công dụng: ${text} (${note})`);
        }
    }

    console.log('Seed completed!');
    await conn.close();
}

seed().catch(err => console.error(err));
