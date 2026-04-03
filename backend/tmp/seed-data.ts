import * as dotenv from 'dotenv';
dotenv.config();

import { createConnection } from 'typeorm';
import { ViThuoc } from '../src/models/vi-thuoc.model';
import { NhomDuocLy } from '../src/models/nhom-duoc-ly.model';
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
        entities: [ViThuoc, NhomDuocLy, CongDung],
        synchronize: true,
    });

    console.log('Connected to Aiven DB. Seeding NhomDuocLy and CongDung...');
    const vtRepo = conn.getRepository(ViThuoc);
    const ndlRepo = conn.getRepository(NhomDuocLy);
    const cdRepo = conn.getRepository(CongDung);

    const vts = await vtRepo.find();
    
    // Seed Nhom Duoc Ly
    const nhomSet = new Set<string>();
    vts.forEach(vt => {
        if (vt.nhom_duoc_ly) nhomSet.add(vt.nhom_duoc_ly.trim());
    });
    
    for (const nhom of nhomSet) {
        if (!nhom) continue;
        const exist = await ndlRepo.findOneBy({ ten_nhom: nhom });
        if (!exist) {
            await ndlRepo.save(ndlRepo.create({ ten_nhom: nhom }));
            console.log(`+ Nhóm: ${nhom}`);
        }
    }

    // Seed Cong Dung
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
