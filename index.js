import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const app = express();
app.use(express.json());

// Fonction pour télécharger localement le fichier audio depuis l'URL
async function downloadAudioToTemp(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
  await fs.writeFile(tempFilePath, response.data);
  return tempFilePath;
}

// Fonction pour obtenir la durée audio avec ffprobe
function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      if (!metadata || !metadata.format || !metadata.format.duration) {
        return reject(new Error('Durée introuvable dans les métadonnées'));
      }
      resolve(metadata.format.duration);
    });
  });
}

app.post('/audio-duration', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.error('Erreur : le champ "url" est manquant dans la requête');
    return res.status(400).json({ error: 'Le champ "url" est obligatoire dans le corps JSON' });
  }

  try {
    console.log(`🎵 Téléchargement audio depuis: ${url}`);
    const audioPath = await downloadAudioToTemp(url);

    console.log('⏳ Analyse de la durée audio...');
    const duration = await getAudioDuration(audioPath);

    console.log(`✅ Durée du fichier audio : ${duration.toFixed(2)} secondes`);

    // Nettoyage du fichier temporaire
    await fs.unlink(audioPath);
    console.log('🧹 Fichier temporaire supprimé');

    return res.json({ duration });
  } catch (error) {
    console.error('❌ Erreur lors du traitement de la durée audio :', error.message);
    return res.status(500).json({ error: 'Erreur lors de la récupération de la durée audio', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
