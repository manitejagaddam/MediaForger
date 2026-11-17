import { AudioEngine } from '@mediaforge/audio-engine';

/**
 * In-browser synthetic fixture generators for live presentation demos.
 * Generates real, byte-valid media without requiring any external network or mock data.
 */

/**
 * Generates an 800x800 studio portrait image with a distinct central silhouette subject
 */
export async function createDemoPortraitImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // 1. Studio office background (subtle lighting)
  const bgGrad = ctx.createLinearGradient(0, 0, 800, 800);
  bgGrad.addColorStop(0, '#27272a');
  bgGrad.addColorStop(0.5, '#18181b');
  bgGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 800);

  // Background office elements (glass frame & plant silhouette)
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(40, 40, 260, 480);
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(100, 700, 80, 0, Math.PI * 2);
  ctx.fill();

  // 2. Central Portrait Subject (Crisp Face & Torso)
  // Suit / Torso
  ctx.fillStyle = '#1e1b4b'; // Deep Navy Suit
  ctx.beginPath();
  ctx.moveTo(220, 800);
  ctx.quadraticCurveTo(240, 520, 340, 480);
  ctx.lineTo(460, 480);
  ctx.quadraticCurveTo(560, 520, 580, 800);
  ctx.closePath();
  ctx.fill();

  // Shirt Collar & Tie
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(370, 480);
  ctx.lineTo(400, 580);
  ctx.lineTo(430, 480);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#e11d48'; // Red Tie
  ctx.beginPath();
  ctx.moveTo(394, 500);
  ctx.lineTo(406, 500);
  ctx.lineTo(408, 640);
  ctx.lineTo(400, 660);
  ctx.lineTo(392, 640);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = '#fbcfe8';
  ctx.fillRect(370, 400, 60, 90);

  // Head / Face
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.ellipse(400, 320, 90, 115, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#172554';
  ctx.beginPath();
  ctx.arc(400, 270, 100, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes & Smile
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(365, 310, 8, 0, Math.PI * 2);
  ctx.arc(435, 310, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#991b1b';
  ctx.beginPath();
  ctx.arc(400, 360, 35, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'demo_executive_portrait.png', { type: 'image/png' }));
      } else {
        reject(new Error('Failed to create portrait blob'));
      }
    }, 'image/png');
  });
}

/**
 * Synthesizes a real 4-second harmonic stereo audio track (44.1 kHz)
 */
export async function createDemoAudioTrack(): Promise<File> {
  const sampleRate = 44100;
  const duration = 4.0;
  const numSamples = Math.floor(sampleRate * duration);

  const offlineCtx = new OfflineAudioContext(2, numSamples, sampleRate);

  // Chords: A minor progression
  const freqs = [220, 261.63, 329.63, 440]; // A3, C4, E4, A4

  freqs.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, 0);

    // Dynamic tremolo & envelope
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.25, 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(0);
    osc.stop(duration);
  });

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = await AudioEngine.encodeWav(renderedBuffer);

  return new File([wavBlob], 'demo_harmonic_soundtrack.wav', { type: 'audio/wav' });
}

/**
 * Creates a sample CSV dataset with headers and quoted fields
 */
export function createDemoCsvFile(): File {
  const csvContent = `id,product_name,category,price_usd,rating,inventory,notes
101,"Ultra HD Monitor, 32-inch","Displays",499.99,4.8,142,"Supports 4K @ 144Hz, HDR1000"
102,"Wireless Studio Headphones","Audio",179.50,4.6,85,"Active noise cancelling, 40h battery"
103,"Mechanical Ergonomic Keyboard","Peripherals",129.99,4.9,210,"Hot-swappable switches, RGB"
104,"4K Creator Webcam, Autofocus","Cameras",89.00,4.4,63,"Built-in stereo mic, dual privacy shutter"
105,"Solid State Drive, 2TB NVMe","Storage",149.99,4.9,320,"7400 MB/s read speed, PCIe Gen 4"`;

  const blob = new Blob([csvContent], { type: 'text/csv' });
  return new File([blob], 'demo_hardware_inventory.csv', { type: 'text/csv' });
}

/**
 * Generates an animated video canvas exported to WebM
 */
export async function createDemoVideoFile(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  // Check if MediaRecorder is supported
  if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
    // Fallback single frame webm/image container
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    ctx.fillText('MediaForge Demo Video (1080p WebM)', 40, 180);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    return new File([blob], 'demo_showcase.webm', { type: 'video/webm' });
  }

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordPromise = new Promise<File>((resolve) => {
    recorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      resolve(new File([videoBlob], 'demo_showcase.webm', { type: 'video/webm' }));
    };
  });

  recorder.start();

  // Animate 60 frames (2 seconds)
  let frame = 0;
  const interval = setInterval(() => {
    frame++;
    const t = frame / 30;

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 640, 360);

    // Outer grid lines
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 360);
      ctx.stroke();
    }

    // Moving dynamic pulse circle
    const cx = 320 + Math.sin(t * 3) * 120;
    const cy = 180 + Math.cos(t * 3) * 50;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    // Timecode display
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px monospace';
    ctx.fillText(`TIME: 00:0${Math.floor(t)}:${Math.floor((t % 1) * 30)}`, 40, 50);
    ctx.fillText('MEDIAFORGE 60FPS LOCAL RENDER', 40, 80);

    if (frame >= 60) {
      clearInterval(interval);
      recorder.stop();
    }
  }, 33);

  return recordPromise;
}
