import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
          rejectUnauthorized: true,
          ca: process.env.CA_CERTIFICATE,
        }
    });
    
    await client.connect();
    console.log('Connected to Aiven PostgreSQL');
    
    // Auto-create tables if they don't exist yet
    await client.query(`
        CREATE TABLE IF NOT EXISTS "nhom_duoc_ly" (
            "id" SERIAL NOT NULL,
            "ten_nhom" character varying(255) NOT NULL,
            CONSTRAINT "PK_nhom_duoc_ly" PRIMARY KEY ("id")
        )
    `);
    await client.query(`
        CREATE TABLE IF NOT EXISTS "cong_dung" (
            "id" SERIAL NOT NULL,
            "ten_cong_dung" character varying(255) NOT NULL,
            "ghi_chu" character varying(500) DEFAULT '',
            CONSTRAINT "PK_cong_dung" PRIMARY KEY ("id")
        )
    `);

    const res = await client.query('SELECT nhom_duoc_ly, cong_dung FROM vi_thuoc');
    const vts = res.rows;

    const nhomSet = new Set<string>();
    const cdMap = new Map<string, string>();

    vts.forEach(vt => {
        if (vt.nhom_duoc_ly) nhomSet.add(vt.nhom_duoc_ly.trim());
        
        if (vt.cong_dung) {
            const entries = vt.cong_dung.split('; ').filter(Boolean);
            entries.forEach((e: string) => {
                const parts = e.split('||');
                const t = (parts[0] || '').trim();
                const n = (parts[1] || '').trim();
                if (t) cdMap.set(t, n || cdMap.get(t) || '');
            });
        }
    });

    console.log(`Found ${nhomSet.size} unique Nhóm Dược Lý`);
    for (const nhom of nhomSet) {
        if (!nhom) continue;
        const exists = await client.query('SELECT 1 FROM nhom_duoc_ly WHERE ten_nhom = $1', [nhom]);
        if (exists.rowCount === 0) {
            await client.query('INSERT INTO nhom_duoc_ly (ten_nhom) VALUES ($1)', [nhom]);
        }
    }

    console.log(`Found ${cdMap.size} unique Công Dụng`);
    for (const [text, note] of cdMap.entries()) {
        const exists = await client.query('SELECT 1 FROM cong_dung WHERE ten_cong_dung = $1', [text]);
        if (exists.rowCount === 0) {
            await client.query('INSERT INTO cong_dung (ten_cong_dung, ghi_chu) VALUES ($1, $2)', [text, note]);
        }
    }

    console.log('Seed database completed successfully!');
    await client.end();
}

run().catch(console.error);
