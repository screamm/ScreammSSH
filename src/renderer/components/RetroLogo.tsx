import React, { useEffect, useRef } from 'react';

interface RetroLogoProps {
  size?: number;
  animated?: boolean;
  color?: string;
}

const RetroLogo: React.FC<RetroLogoProps> = ({ 
  size = 150, 
  animated = true,
  color = '#0f0' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIdRef = useRef<number>(0);
  
  // Rita upp loggan som en terminal-stilad text med glöd-effekt
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ange canvas-storlek
    canvas.width = size;
    canvas.height = size;
    
    // Starta animationsloop om animerad
    if (animated) {
      const animate = (time: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawLogo(ctx, canvas.width, canvas.height, time, color);
        frameIdRef.current = requestAnimationFrame(animate);
      };
      
      frameIdRef.current = requestAnimationFrame(animate);
      
      // Städa upp vid unmount
      return () => {
        cancelAnimationFrame(frameIdRef.current);
      };
    } else {
      // Rita statisk logga
      drawLogo(ctx, canvas.width, canvas.height, 0, color);
    }
  }, [size, animated, color]);
  
  return (
    <div 
      style={{ 
        position: 'relative',
        width: size,
        height: size
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%' 
        }}
      />
      
      {/* Skannlinjer-effekt */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.3) 50%)',
          backgroundSize: '100% 4px',
          zIndex: 2,
          pointerEvents: 'none',
          opacity: 0.3
        }}
      />
      
      {/* Glöd-effekt */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          boxShadow: `0 0 ${size / 5}px ${color}`,
          opacity: 0.3,
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(10px)'
        }}
      />
    </div>
  );
};

// Hjälpfunktion för att rita loggan
function drawLogo(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  time: number,
  color: string
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;
  
  // Bakgrund - rita en cirkel
  ctx.save();
  
  // Sätt opacity baserat på animation
  const pulseValue = animated => {
    if (!animated) return 0.9;
    return 0.6 + Math.sin(time / 500) * 0.3;
  };
  
  // Yttre glöd
  const gradient = ctx.createRadialGradient(
    centerX, centerY, radius * 0.7,
    centerX, centerY, radius * 1.5
  );
  gradient.addColorStop(0, `${color}`);
  gradient.addColorStop(1, 'transparent');
  
  ctx.globalAlpha = pulseValue(time);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Inre cirkel
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#111';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Rita en stiliserad SSH-ikon
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  
  // S
  const sCurveSize = radius * 0.3;
  const sX = centerX - radius * 0.5;
  const sY = centerY - radius * 0.2;
  
  ctx.beginPath();
  ctx.moveTo(sX - sCurveSize, sY - sCurveSize * 0.5);
  ctx.bezierCurveTo(
    sX - sCurveSize * 0.5, sY - sCurveSize * 0.8,
    sX + sCurveSize * 0.5, sY - sCurveSize * 0.8,
    sX + sCurveSize * 0.7, sY - sCurveSize * 0.3
  );
  ctx.bezierCurveTo(
    sX + sCurveSize * 0.9, sY,
    sX - sCurveSize * 0.5, sY + sCurveSize * 0.5,
    sX - sCurveSize * 0.8, sY + sCurveSize * 0.7
  );
  ctx.stroke();
  
  // Andra S
  const s2X = sX + radius * 0.4;
  
  ctx.beginPath();
  ctx.moveTo(s2X - sCurveSize, sY - sCurveSize * 0.5);
  ctx.bezierCurveTo(
    s2X - sCurveSize * 0.5, sY - sCurveSize * 0.8,
    s2X + sCurveSize * 0.5, sY - sCurveSize * 0.8,
    s2X + sCurveSize * 0.7, sY - sCurveSize * 0.3
  );
  ctx.bezierCurveTo(
    s2X + sCurveSize * 0.9, sY,
    s2X - sCurveSize * 0.5, sY + sCurveSize * 0.5,
    s2X - sCurveSize * 0.8, sY + sCurveSize * 0.7
  );
  ctx.stroke();
  
  // H
  const hX = s2X + radius * 0.4;
  const hY = sY;
  const hHeight = sCurveSize * 1.4;
  
  ctx.beginPath();
  ctx.moveTo(hX - sCurveSize * 0.5, hY - hHeight / 2);
  ctx.lineTo(hX - sCurveSize * 0.5, hY + hHeight / 2);
  ctx.moveTo(hX - sCurveSize * 0.5, hY);
  ctx.lineTo(hX + sCurveSize * 0.5, hY);
  ctx.moveTo(hX + sCurveSize * 0.5, hY - hHeight / 2);
  ctx.lineTo(hX + sCurveSize * 0.5, hY + hHeight / 2);
  ctx.stroke();
  
  // Nätverkslinjer
  const linesCount = 4;
  ctx.globalAlpha = 0.5 + Math.sin(time / 1000) * 0.2;
  
  for (let i = 0; i < linesCount; i++) {
    const angle = (Math.PI * 2 / linesCount) * i + time / 2000;
    const innerX = centerX + Math.cos(angle) * radius * 0.6;
    const innerY = centerY + Math.sin(angle) * radius * 0.6;
    const outerX = centerX + Math.cos(angle) * radius * 1.2;
    const outerY = centerY + Math.sin(angle) * radius * 1.2;
    
    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.stroke();
    
    // Små noder vid yttre änden
    ctx.beginPath();
    ctx.arc(outerX, outerY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Text "ScreammSSH"
  ctx.font = `bold ${radius * 0.25}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = color;
  ctx.globalAlpha = 1;
  
  // Lägg till glöd på texten
  ctx.shadowColor = color;
  ctx.shadowBlur = 5;
  ctx.fillText('ScreammSSH', centerX, centerY + radius + radius * 0.3);
  ctx.shadowBlur = 0;
  
  ctx.restore();
}

export default RetroLogo; 