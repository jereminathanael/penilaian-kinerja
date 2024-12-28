import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
const adminUser = { username: "admin", password: "admin123" };

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Pengawasan",
  password: "bahagia3",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("login.ejs", { errorMessage: null });
});

app.get("/logout", (req, res) => {
  res.redirect("/");
});

app.get("/home", async (req, res) => {
  const result1 = await db.query("SELECT * FROM kriteria");
  const result2 = await db.query("SELECT * FROM data_karyawan");
  const result3 = await db.query(
    "SELECT p.id AS penilaian_id, k.nama_karyawan AS nama_karyawan, p.absensi, p.kinerja, p.kerjasama, p.kreativitas, p.sikap FROM penilaian_karyawan p JOIN data_karyawan k ON p.karyawan_id = k.id"
  );
  let jumlahKriteria = result1.rowCount;
  let jumlahKaryawan = result2.rowCount;
  let jumlahPenilaian = result3.rowCount;
  res.render("home.ejs", { 
    jumlahKriteria: jumlahKriteria,
    jumlahKaryawan: jumlahKaryawan,
    jumlahPenilaian: jumlahPenilaian,
  });
});

app.get("/kriteria", async (req, res) => {
  const result = await db.query("SELECT * FROM kriteria");
  let kriteria = result.rows;

  res.render("kriteria.ejs", { kriteria: kriteria });
})

app.get("/karyawan", async (req, res) => {
  const result = await db.query("SELECT * FROM data_karyawan");
  let data_karyawan = result.rows;
  res.render("karyawan.ejs", { dataKaryawan: data_karyawan });
});

app.get("/penilaian", async (req, res) => {
  const result = await db.query(
    "SELECT p.id AS penilaian_id, k.nama_karyawan AS nama_karyawan, p.absensi, p.kinerja, p.kerjasama, p.kreativitas, p.sikap FROM penilaian_karyawan p JOIN data_karyawan k ON p.karyawan_id = k.id"
  );
  let penilaian = result.rows;
  res.render("penilaian.ejs", { penilaian: penilaian });
});

app.get("/ranking", async (req, res) => {
  const result = await db.query(`
    SELECT 
      data_karyawan.id, 
      data_karyawan.nama_karyawan AS nama_karyawan, 
      (
        COALESCE(
          CASE penilaian_karyawan.absensi 
                WHEN 'sangat baik' THEN 20
                WHEN 'baik' THEN 15
                WHEN 'cukup' THEN 10
                WHEN 'tidak baik' THEN 5
            END, 0) +
        COALESCE(
            CASE penilaian_karyawan.kinerja 
                WHEN 'sangat baik' THEN 20
                WHEN 'baik' THEN 15
                WHEN 'cukup' THEN 10
                WHEN 'tidak baik' THEN 5
            END, 0) +
        COALESCE(
            CASE penilaian_karyawan.kerjasama 
                WHEN 'sangat baik' THEN 20
                WHEN 'baik' THEN 15
                WHEN 'cukup' THEN 10
                WHEN 'tidak baik' THEN 5
            END, 0) +
        COALESCE(
            CASE penilaian_karyawan.kreativitas 
                WHEN 'sangat baik' THEN 20
                WHEN 'baik' THEN 15
                WHEN 'cukup' THEN 10
                WHEN 'tidak baik' THEN 5
            END, 0) +
        COALESCE(
            CASE penilaian_karyawan.sikap 
                WHEN 'sangat baik' THEN 20
                WHEN 'baik' THEN 15
                WHEN 'cukup' THEN 10
                WHEN 'tidak baik' THEN 5
            END, 0)
      ) AS total_nilai
    FROM 
        data_karyawan
    LEFT JOIN 
        penilaian_karyawan ON data_karyawan.id = penilaian_karyawan.karyawan_id
    ORDER BY
      total_nilai DESC

  `);
  let ranking = result.rows;
  res.render("ranking.ejs", { ranking: ranking });
});

app.get("/tambah-karyawan", (req, res) => {
  res.render("tambah-karyawan.ejs");
});

app.get("/tambah-penilaian", async (req, res) => {
  const result = await db.query("SELECT id, nama_karyawan FROM data_karyawan");
  let tambahPenilaian = result.rows;
  res.render("tambah-penilaian.ejs", { karyawan: tambahPenilaian });
});

// post dari login
app.post("/home", async (req, res) => {
  const { username, password } = req.body;
  const result1 = await db.query("SELECT * FROM kriteria");
  const result2 = await db.query("SELECT * FROM data_karyawan");
  const result3 = await db.query(
    "SELECT p.id AS penilaian_id, k.nama_karyawan AS nama_karyawan, p.absensi, p.kinerja, p.kerjasama, p.kreativitas, p.sikap FROM penilaian_karyawan p JOIN data_karyawan k ON p.karyawan_id = k.id"
  );
  let jumlahKriteria = result1.rowCount;
  let jumlahKaryawan = result2.rowCount;
  let jumlahPenilaian = result3.rowCount;

  if (username === adminUser.username && password === adminUser.password) {
    res.render("home.ejs", {
        jumlahKriteria: jumlahKriteria,
        jumlahKaryawan: jumlahKaryawan,
        jumlahPenilaian: jumlahPenilaian,
    });
  } else {
    res.render("login.ejs", { errorMessage: "Username atau Password salah" });
  }
});

// post dari tambah karyawan
app.post("/tambah-karyawan", async (req, res) => {
  const { kodeKaryawan, namaKaryawan, tempatTanggalLahir, jabatan, divisi } = req.body;

  try {
    await db.query(
      "INSERT INTO data_karyawan (kode, nama_karyawan, tempat_tanggal_lahir, jabatan, divisi) VALUES ($1, $2, $3, $4, $5)",
      [kodeKaryawan, namaKaryawan, tempatTanggalLahir, jabatan, divisi]
    )
  
    res.redirect("/karyawan");
  } catch (err) {
    console.log(err);
    res.render("tambah-karyawan.ejs", { errorMessage: "Kode karyawan tidak boleh sama / lebih dari 3 digit" })
  }
});

// post Hapus data karyawan
app.post('/delete-karyawan/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM data_karyawan WHERE id = $1', [id]);

  res.redirect('/karyawan');
});

// post tambah penilaian
app.post("/tambah-penilaian", async (req, res) => {
  const {karyawan_id, absensi, kinerja, kerjasama, kreativitas, sikap} = req.body;
  await db.query("INSERT INTO penilaian_karyawan (karyawan_id, absensi, kinerja, kerjasama, kreativitas, sikap) VALUES ($1, $2, $3, $4, $5, $6)",
    [karyawan_id, absensi, kinerja, kerjasama, kreativitas, sikap]
  );
  res.redirect("penilaian");
});

// post Hapus penilaian karyawan
app.post('/hapus-penilaian/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM penilaian_karyawan WHERE id = $1', [id]);

  res.redirect('/penilaian');
});

app.listen(port, () => {
  console.log(`Your server is running on port ${port}`);
});
