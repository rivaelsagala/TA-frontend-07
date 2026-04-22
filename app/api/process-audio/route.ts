import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log("🔹 API Key dari ENV (setelah path resolve):", process.env.OPENAI_API_KEY);


import { NextResponse } from 'next/server';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const writeFileAsync = promisify(fs.writeFile);

ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');
ffmpeg.setFfprobePath('C:/ffmpeg/bin/ffprobe.exe');

export async function POST(req: Request) {
    try {
        console.log("🔹 Memproses request audio...");

        const speechKey = process.env.AZURE_SPEECH_KEY;
        const region = process.env.AZURE_SPEECH_REGION || 'southeastasia';

        if (!speechKey) {
            console.error("❌ API Key tidak ditemukan!");
            return NextResponse.json({ error: 'Azure Speech API Key tidak ditemukan' }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get("audio") as File | null;

        if (!file) {
            console.error("❌ Tidak ada file audio dalam request!");
            return NextResponse.json({ error: 'File audio tidak ditemukan dalam request' }, { status: 400 });
        }

        console.log("✅ File audio diterima:", file.name);

        const tempDir = path.join(process.cwd(), 'public/temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const tempFilePath = path.join(tempDir, 'audio_input.wav');
        const convertedFilePath = path.join(tempDir, 'audio_fixed.wav');
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        if (fileBuffer.length === 0) {
            console.error("❌ File audio kosong!");
            return NextResponse.json({ error: 'File audio kosong' }, { status: 400 });
        }

        await writeFileAsync(tempFilePath, fileBuffer);
        console.log("✅ File audio disimpan:", tempFilePath);

        console.log("🔍 Mengonversi format WAV jika diperlukan...");
        await new Promise((resolve, reject) => {
            ffmpeg(tempFilePath)
                .audioCodec('pcm_s16le')
                .audioFrequency(16000)
                .audioChannels(1)
                .format('wav')
                .on('end', () => {
                    console.log("✅ FFmpeg konversi selesai.");
                    resolve();
                })
                .on('error', (err) => {
                    console.error("❌ FFmpeg error:", err);
                    reject(err);
                })
                .save(convertedFilePath);
        });

        if (!fs.existsSync(convertedFilePath)) {
            console.error("❌ File audio hasil konversi tidak ditemukan!");
            return NextResponse.json({ error: 'File audio tidak ditemukan setelah konversi' }, { status: 500 });
        }

        console.log("🔍 Menggunakan file audio untuk pengenalan suara:", convertedFilePath);
        
        const relativePath = path.relative(process.cwd(), convertedFilePath);
        console.log("🔍 Path relatif yang digunakan:", relativePath);

        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region);
        speechConfig.speechRecognitionLanguage = 'id-ID';

        const audioBuffer = fs.readFileSync(convertedFilePath);
        const pushStream = sdk.AudioInputStream.createPushStream();
        pushStream.write(audioBuffer);
        pushStream.close();

        const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);


        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        console.log("🔹 Mulai mengenali suara...");
        return new Promise((resolve) => {
            recognizer.recognizeOnceAsync(async (result) => {
                recognizer.close();
                await unlinkAsync(tempFilePath);
                await unlinkAsync(convertedFilePath);
                console.log("✅ Proses pengenalan suara selesai.");

                if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                    console.log("✅ Teks terdeteksi:", result.text);

                    console.log("🔹 Mengirim request ke OpenAI GPT dengan teks:", result.text);
                    console.log("🔹 API Key digunakan:", process.env.OPENAI_API_KEY ? "TERSEDIA" : "TIDAK TERSEDIA");

                
                    // 🔹 Kirim teks ke OpenAI GPT API untuk mendapatkan jawaban
                    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: "gpt-4",
                            messages: [{ role: "user", content: result.text }]
                        })
                    });
                
                    const gptData = await gptResponse.json();
                    const chatbotReply = gptData.choices?.[0]?.message?.content || "Maaf, saya tidak mengerti.";
                
                    console.log("🤖 Jawaban AI:", chatbotReply);
                
                    // 🔹 Konversi jawaban dari GPT ke suara dengan Azure Speech (Text-to-Speech)
                    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION);
                    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
                
                    synthesizer.speakTextAsync(chatbotReply, result => {
                        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                            console.log("🔊 Audio berhasil diputar.");
                        } else {
                            console.error("❌ Gagal memutar audio.");
                        }
                        synthesizer.close();
                    });
                
                    // 🔹 Kirim respons ke frontend
                    resolve(NextResponse.json({ text: chatbotReply }));
                }
                 else {
                    console.error("❌ Gagal mengenali suara.");
                    resolve(NextResponse.json({ error: 'Gagal mengenali suara' }, { status: 500 }));
                }
            });
        });
    } catch (error) {
        console.error("❌ Error di backend:", error);
        return NextResponse.json({ error: 'Terjadi kesalahan di backend' }, { status: 500 });
    }
}
