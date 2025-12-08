import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  levels: number[];
  isActive: boolean;
}

const AudioWaveform = ({ levels, isActive }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = levels.length;
    const barWidth = width / barCount - 2;
    const gap = 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw bars
    levels.forEach((level, i) => {
      const barHeight = (level / 100) * height * 0.9;
      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      // Create gradient
      const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
      
      if (isActive) {
        gradient.addColorStop(0, 'hsl(280, 100%, 65%)'); // Purple
        gradient.addColorStop(0.5, 'hsl(260, 100%, 70%)');
        gradient.addColorStop(1, 'hsl(200, 100%, 70%)'); // Cyan
      } else {
        gradient.addColorStop(0, 'hsl(240, 10%, 30%)');
        gradient.addColorStop(1, 'hsl(240, 10%, 40%)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight || 2, 2);
      ctx.fill();
    });
  }, [levels, isActive]);

  return (
    <div className="relative w-full h-16 bg-card/30 rounded-lg border border-border overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={320} 
        height={64}
        className="w-full h-full"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Start recording to see waveform
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;
