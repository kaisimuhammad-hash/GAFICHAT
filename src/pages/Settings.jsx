import { useState } from 'react';
import {
  BookOpen,
  Bot,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  KeyRound,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Thermometer,
  TriangleAlert,
  Undo2,
  Upload,
  Wand2,
  Zap,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Field,
  IconButton,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  cn,
} from '../components/ui.jsx';
import { api } from '../lib/api.js';

function SectionTitle({ icon: Icon, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function Settings({ state, refresh, pushToast }) {
  const settings = state.settings;
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [removeKey, setRemoveKey] = useState(false);
  const [model, setModel] = useState(settings.geminiModel);
  const [prompt, setPrompt] = useState(settings.systemPrompt);
  const [knowledge, setKnowledge] = useState(settings.knowledge || '');
  const [temperature, setTemperature] = useState(settings.temperature);
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens);
  const [delay, setDelay] = useState(settings.replyDelayMs);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [kbOpen, setKbOpen] = useState(false);
  const [kbTitle, setKbTitle] = useState('');
  const [kbBody, setKbBody] = useState('');

  const hasKey = settings.hasKey && !removeKey;
  const kbEntry = [kbTitle.trim() ? `## ${kbTitle.trim()}` : '', kbBody.trim()]
    .filter(Boolean)
    .join('\n');
  const kbNextValue = [knowledge.trim(), kbEntry].filter(Boolean).join('\n\n');

  const openKb = () => {
    setKbTitle('');
    setKbBody('');
    setKbOpen(true);
  };

  const addKnowledgeEntry = () => {
    if (!kbEntry) {
      pushToast({ type: 'warning', title: 'Entri masih kosong', text: 'Isi judul atau konten terlebih dahulu.' });
      return;
    }
    if (kbNextValue.length > 12000) {
      pushToast({
        type: 'error',
        title: 'Basis pengetahuan penuh',
        text: `Entri melebihi batas 12.000 karakter. Sisa ruang ${12000 - knowledge.trim().length} karakter.`,
      });
      return;
    }
    setKnowledge(kbNextValue);
    setKbOpen(false);
    pushToast({
      type: 'success',
      title: 'Entri ditambahkan',
      text: 'Tekan “Simpan perubahan” agar entri dipakai bot.',
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        geminiModel: model,
        systemPrompt: prompt,
        knowledge,
        temperature: Number(temperature),
        maxTokens: Number(maxTokens),
        replyDelayMs: Number(delay),
      };
      if (apiKey.trim()) payload.geminiApiKey = apiKey.trim();
      if (removeKey) payload.geminiApiKey = '';

      await api.updateSettings(payload);
      setApiKey('');
      setRemoveKey(false);
      setTestResult(null);
      await refresh();
      pushToast({
        type: 'success',
        title: 'Pengaturan disimpan',
        text: 'Persona dan konfigurasi AI sudah diterapkan.',
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal menyimpan pengaturan', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const importKnowledge = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) {
      pushToast({ type: 'error', title: 'File terlalu besar', text: 'Gunakan file teks maksimal 1 MB.' });
      return;
    }
    try {
      const text = await file.text();
      const clipped = text.slice(0, 12000);
      setKnowledge(clipped);
      pushToast({
        type: 'success',
        title: 'Basis pengetahuan dimuat',
        text:
          clipped.length < text.length
            ? `${file.name} dipotong ke 12.000 karakter pertama.`
            : `${file.name} siap disimpan.`,
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal membaca file', text: err.message });
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testGemini();
      setTestResult({ ok: true, ...result });
      pushToast({ type: 'success', title: 'Koneksi Gemini berhasil', text: `${result.latencyMs} ms` });
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
      pushToast({ type: 'error', title: 'Koneksi Gemini gagal', text: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600/70">
            Konfigurasi
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Pengaturan AI
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Hubungkan Gemini, atur persona, dan kendalikan cara bot membalas pelanggan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={Zap}
            loading={testing}
            onClick={test}
            disabled={!settings.hasKey || removeKey}
            title={settings.hasKey ? 'Uji koneksi ke Gemini' : 'Simpan API key terlebih dahulu'}
          >
            Uji koneksi
          </Button>
          <Button icon={Save} loading={saving} onClick={save}>
            Simpan perubahan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle
              icon={KeyRound}
              title="Kredensial Gemini"
              description="Bot menggunakan Gemini REST API untuk membuat balasan otomatis."
              action={
                <Badge tone={settings.hasKey ? 'emerald' : 'amber'} dot>
                  {settings.hasKey ? (removeKey ? 'Akan dihapus' : 'Tersimpan') : 'Belum diisi'}
                </Badge>
              }
            />

            <div className="mt-4 space-y-4">
              <Field
                label="API key"
                hint={
                  removeKey
                    ? 'API key akan dihapus saat kamu menekan Simpan. Bot berhenti membalas otomatis.'
                    : settings.hasKey
                      ? `Key tersimpan: ${settings.keyPreview}. Isi kolom untuk menggantinya.`
                      : 'Dapatkan API key gratis di Google AI Studio, lalu tempel di sini.'
                }
              >
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={
                      settings.hasKey ? 'Kosongkan untuk mempertahankan key tersimpan' : 'AIza…'
                    }
                    className="pr-[86px] font-mono text-xs"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                    <IconButton
                      label={showKey ? 'Sembunyikan key' : 'Tampilkan key'}
                      className="h-7 w-7"
                      onClick={() => setShowKey((value) => !value)}
                    >
                      {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </IconButton>
                    {settings.hasKey && (
                      <button
                        type="button"
                        onClick={() => setRemoveKey((value) => !value)}
                        className={cn(
                          'rounded-lg px-2 py-1 text-[9px] font-medium transition',
                          removeKey
                            ? 'bg-slate-100 text-slate-600'
                            : 'text-red-600/80 hover:bg-red-50 hover:text-red-600',
                        )}
                      >
                        {removeKey ? 'Urungkan' : 'Hapus'}
                      </button>
                    )}
                  </div>
                </div>
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ExternalLink className="h-3 w-3" />
                  Belum punya API key?
                </span>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-red-600 transition hover:text-red-700"
                >
                  Buka Google AI Studio →
                </a>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[10.5px] leading-relaxed text-amber-700">
                <p className="flex items-center gap-1.5 font-semibold text-amber-700">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Muncul error “free tier is not available”?
                </p>
                <p className="mt-1">
                  API key tersebut berasal dari project Google yang tidak mendapat kuota gratis. Buat API
                  key baru di project baru lewat AI Studio (jangan lewat Cloud Console), atau aktifkan
                  billing pada project itu.
                </p>
                <a
                  href="https://ai.google.dev/gemini-api/docs/troubleshooting#project-unavailable"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block font-medium text-amber-700 transition hover:text-amber-800"
                >
                  Baca panduan Google →
                </a>
              </div>

              <Field
                label="Model Gemini"
                hint="Model bertanda “gratis” berjalan dengan API key tanpa billing. Model Pro/Preview butuh kuota berbayar dan sering kena limit 429."
              >
                <Select value={model} onChange={(event) => setModel(event.target.value)}>
                  {state.models.map((item) => (
                    <option key={item} value={item}>
                      {item}
                      {item.includes('pro') ? '' : ' · gratis'}
                    </option>
                  ))}
                </Select>
              </Field>

              {testResult && (
                <div
                  className={cn(
                    'rounded-xl border px-3.5 py-3 text-[11px] leading-relaxed',
                    testResult.ok
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700',
                  )}
                >
                  {testResult.ok ? (
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div>
                        <p className="font-semibold">Terhubung ke {testResult.model}</p>
                        <p className="mt-0.5 text-emerald-700/70">
                          Respon: “{testResult.reply}” · {testResult.latencyMs} ms
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p>{testResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle
              icon={Wand2}
              title="Persona & instruksi"
              description="Gunakan bahasa yang jelas dan sebutkan batasan yang tidak boleh dilanggar bot."
              action={
                <button
                  type="button"
                  onClick={() => setPrompt(settings.defaultPrompt)}
                  className="flex items-center gap-1 text-[10px] font-medium text-slate-500 transition hover:text-slate-700"
                >
                  <Undo2 className="h-3 w-3" /> Prompt default
                </button>
              }
            />
            <div className="mt-4">
              <Textarea
                rows={9}
                value={prompt}
                maxLength={4000}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Tuliskan persona, gaya bahasa, dan batasan bot…"
                className="text-[12px]"
              />
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>Instruksi ini dikirim sebagai system instruction ke Gemini.</span>
                <span>{prompt.length}/4000</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle
              icon={BookOpen}
              title="Basis pengetahuan"
              description="FAQ, daftar harga, jam operasional, kebijakan retur, atau info bisnis lain."
              action={
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={openKb}
                    className="flex items-center gap-1 text-[10px] font-semibold text-red-600 transition hover:text-red-700"
                  >
                    <Plus className="h-3 w-3" /> Tambah entri
                  </button>
                  <label className="flex cursor-pointer items-center gap-1 text-[10px] font-medium text-red-600 transition hover:text-red-700">
                    <Upload className="h-3 w-3" /> Impor .txt
                    <input
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      className="hidden"
                      onChange={importKnowledge}
                    />
                  </label>
                </div>
              }
            />
            <div className="mt-4">
              <Textarea
                rows={8}
                value={knowledge}
                maxLength={12000}
                onChange={(event) => setKnowledge(event.target.value)}
                placeholder={
                  'Contoh:\nJam operasional: Senin–Sabtu, 08.00–20.00 WIB.\nOngkir Jabodetabek Rp10.000, luar Jabodetabek Rp20.000.\nRetur diterima maksimal 3 hari setelah barang diterima.\nInstagram: @toko.kami'
                }
                className="text-[12px]"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                <span>
                  Hanya dipakai akun yang belum punya basis pengetahuan sendiri. Info khusus per
                  nomor diisi di halaman Akun.
                </span>
                <span className="shrink-0">{knowledge.length}/12000</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle
              icon={Gauge}
              title="Kecepatan & kreativitas"
              description="Atur seberapa ekspresif balasan dan jeda sebelum pesan dikirim."
            />
            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Thermometer className="h-3.5 w-3.5 text-red-600" /> Temperature
                  </span>
                  <span className="font-mono text-[11px] text-red-600">
                    {Number(temperature).toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-red-600"
                />
                <div className="mt-1 flex justify-between text-[9px] text-slate-500">
                  <span>Konsisten & faktual</span>
                  <span>Lebih kreatif</span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Jeda sebelum mengirim</span>
                  <span className="font-mono text-[11px] text-red-600">
                    {(Number(delay) / 1000).toFixed(1)} dtk
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={delay}
                  onChange={(event) => setDelay(Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-red-600"
                />
                <p className="mt-1 text-[9px] text-slate-500">
                  Memberi kesan balasan ditulis manusia. Indikator “mengetik” tampil selama proses.
                </p>
              </div>

              <Field label="Maksimum token balasan" hint="Nilai kecil membuat balasan lebih ringkas dan hemat kuota.">
                <Input
                  type="number"
                  min={64}
                  max={4096}
                  step={64}
                  value={maxTokens}
                  onChange={(event) => setMaxTokens(Number(event.target.value))}
                  className="w-32 font-mono text-xs"
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle icon={Bot} title="Cara kerja bot" />
            <ol className="mt-4 space-y-3">
              {[
                ['Pesan masuk', 'Bot hanya membalas chat pribadi, bukan grup atau status.'],
                ['Cek mode', 'Mode AI harus aktif di akun, atau di percakapan tertentu.'],
                ['Susun konteks', '14 pesan terakhir + persona + basis pengetahuan dikirim ke Gemini.'],
                ['Kirim balasan', 'Indikator mengetik muncul, balasan dikirim setelah jeda.'],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-50 text-[9px] font-bold text-red-600">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700">{title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={Sparkles} title="Kontrol per percakapan" />
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Di halaman Percakapan, setiap chat punya tombol AI/Manual sendiri. Tombol
              <span className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                ikut akun
              </span>
              mengembalikan pengaturan ke bawaan nomor.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-red-500/70" />
              Menekan “Ambil alih” langsung mematikan balasan otomatis pada chat tersebut.
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={ShieldCheck} title="Privasi & data" />
            <ul className="mt-3 space-y-2 text-[10.5px] leading-relaxed text-slate-500">
              <li>• API key disimpan lokal di data/db.json pada perangkat ini.</li>
              <li>• Isi pesan dan basis pengetahuan dikirim ke Google Gemini untuk diproses.</li>
              <li>• Riwayat WhatsApp dan sesi login tidak diunggah ke server pihak ketiga.</li>
              <li>• Kuota gratis Gemini API memiliki batas harian dari Google.</li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-600">Status mesin AI</p>
              <Badge tone={hasKey ? 'emerald' : 'amber'} dot>
                {hasKey ? 'Siap' : 'Nonaktif'}
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-xl',
                  hasKey ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500',
                )}
              >
                {testing ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-slate-700">{model}</p>
                <p className="text-[10px] text-slate-500">
                  {hasKey ? 'Balasan otomatis dapat berjalan' : 'Tambahkan API key untuk memulai'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <p className="pb-1 text-center text-[10px] text-slate-500">
        NexaDesk · Dashboard WhatsApp AI · Data disimpan lokal di perangkat ini
      </p>

      <Modal
        open={kbOpen}
        onClose={() => setKbOpen(false)}
        title="Tambah basis pengetahuan"
        description="Entri baru digabungkan ke basis pengetahuan dan dipakai bot setelah disimpan."
        footer={
          <>
            <Button variant="ghost" onClick={() => setKbOpen(false)}>
              Batal
            </Button>
            <Button icon={Plus} onClick={addKnowledgeEntry} disabled={!kbTitle.trim() && !kbBody.trim()}>
              Tambahkan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Judul" hint="Contoh: Jam operasional, Kebijakan retur, Daftar harga.">
            <Input
              value={kbTitle}
              maxLength={120}
              autoFocus
              onChange={(event) => setKbTitle(event.target.value)}
              placeholder="Jam operasional"
            />
          </Field>
          <Field label="Konten">
            <Textarea
              rows={6}
              value={kbBody}
              maxLength={6000}
              onChange={(event) => setKbBody(event.target.value)}
              placeholder={'Senin–Sabtu, 08.00–20.00 WIB.\nMinggu dan hari libur tutup.'}
            />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
            <span>Entri disusun sebagai bagian “## Judul”.</span>
            <span className="shrink-0 font-mono">{Math.min(12000, kbNextValue.length)}/12000</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
