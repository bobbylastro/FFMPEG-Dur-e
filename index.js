import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const app = express();
app.use(express.json());

// Gestion globale des erreurs non interceptées
process.on('uncaughtException', (err) => {
  console.error('Exception non capturée :', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejet non géré :', reason);
});

app.post('/audio-duration', (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.error('Erreur : le champ "url" est manquant dans la requête');
    return res.status(400).json({ error: 'Le champ "url" est obligatoire dans le corps JSON' });
  }

  ffmpeg.ffprobe(url, (err, metadata) => {
    if (err) {
      console.error('Erreur ffprobe lors de la récupération des métadonnées :', err);
      return res.status(500).json({ error: 'Impossible de récupérer les métadonnées', details: err.message });
    }

    const duration = metadata.format.duration;

    if (!duration) {
      console.error('Durée introuvable dans les métadonnées du fichier audio');
      return res.status(404).json({ error: 'Durée introuvable dans les métadonnées du fichier audio' });
    }

    console.log(`Durée récupérée avec succès : ${duration} secondes`);
    return res.json({ duration });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Audio duration API démarrée sur le port ${PORT}`);
});
