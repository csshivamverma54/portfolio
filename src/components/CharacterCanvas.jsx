import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 64;
const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const VIDEO_ASPECT = VIDEO_WIDTH / VIDEO_HEIGHT;
// Exact face coordinates verified in character.mp4
const FACE_SRC_X = 640;
const FACE_SRC_Y = 320;
// Studio red background color from character video
const BG_COLOR = '#bd1f1c';

export default function CharacterCanvas({ onLoaded, onFaceCoords }) {
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const centerFrameRef = useRef(null);

  // Mouse & Animation State
  const mouseRef = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetAngle: 0,
    currentAngle: 0,
    isDeadzone: true,
    hasMoved: false,
  });

  const [loadingProgress, setLoadingProgress] = useState(0);

  // 1. Preload all 64 WebP frames + center.webp
  useEffect(() => {
    let loadedCount = 0;
    const totalToLoad = TOTAL_FRAMES + 1; // 64 directional + 1 center
    const directionalImages = [];

    const handleImageLoad = () => {
      loadedCount++;
      const pct = Math.floor((loadedCount / totalToLoad) * 100);
      setLoadingProgress(pct);

      if (loadedCount === totalToLoad) {
        if (onLoaded) onLoaded();
      }
    };

    // Load 64 directional frames
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/frame_${i}.webp`;
      img.onload = handleImageLoad;
      img.onerror = () => {
        // Fallback to padded format if needed
        const padded = String(i).padStart(2, '0');
        img.src = `/frames/frame_${padded}.webp`;
      };
      directionalImages.push(img);
    }
    framesRef.current = directionalImages;

    // Load Center Frame
    const centerImg = new Image();
    centerImg.src = '/frames/center.webp';
    centerImg.onload = handleImageLoad;
    centerFrameRef.current = centerImg;
  }, [onLoaded]);

  // 2. Cursor / Pointer tracking and Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let animationFrameId;

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouseRef.current.x = clientX;
      mouseRef.current.y = clientY;
      mouseRef.current.hasMoved = true;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchstart', handlePointerMove, { passive: true });

    // Render loop
    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;

      // Ensure canvas internal buffer matches retina display size
      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }

      // Calculate object-fit: cover scaling
      const canvasAspect = cssW / cssH;
      let drawW, drawH, drawX, drawY, scale;

      if (canvasAspect > VIDEO_ASPECT) {
        // Canvas is wider than video (letterbox top/bottom)
        scale = cssW / VIDEO_WIDTH;
        drawW = cssW;
        drawH = VIDEO_HEIGHT * scale;
        drawX = 0;
        drawY = (cssH - drawH) / 2;
      } else {
        // Canvas is taller than video (crop left/right)
        scale = cssH / VIDEO_HEIGHT;
        drawW = VIDEO_WIDTH * scale;
        drawH = cssH;
        drawX = (cssW - drawW) / 2;
        drawY = 0;
      }

      // Exact face center on screen in CSS pixels
      const faceScreenX = drawX + FACE_SRC_X * scale;
      const faceScreenY = drawY + FACE_SRC_Y * scale;

      if (onFaceCoords) {
        onFaceCoords({ x: faceScreenX, y: faceScreenY });
      }

      // Calculate dx, dy from face center to cursor
      const dx = mouseRef.current.x - faceScreenX;
      const dy = mouseRef.current.y - faceScreenY;
      const dist = Math.hypot(dx, dy);

      // Deadzone threshold (~12% diagonal radius for direct eye contact)
      const screenRadius = Math.hypot(cssW, cssH) * 0.12;
      const inDeadzone = !mouseRef.current.hasMoved || dist < screenRadius;
      mouseRef.current.isDeadzone = inDeadzone;

      // Calculate target angle in radians (Clockwise from UP = 0)
      // Math.atan2(dy, dx) returns angle from positive X (RIGHT = 0, DOWN = +PI/2, UP = -PI/2)
      // Adding PI/2 shifts 0 to UP!
      let target = Math.atan2(dy, dx) + Math.PI / 2;
      if (target < 0) target += Math.PI * 2;
      mouseRef.current.targetAngle = target;

      // Shortest-path circular angular lerp
      let diff = mouseRef.current.targetAngle - mouseRef.current.currentAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      // High response factor (~0.26) for instantaneous ~35ms zero-lag tracking
      mouseRef.current.currentAngle += diff * 0.26;

      // Normalize currentAngle to [0, 2*PI)
      if (mouseRef.current.currentAngle < 0) mouseRef.current.currentAngle += Math.PI * 2;
      if (mouseRef.current.currentAngle >= Math.PI * 2) mouseRef.current.currentAngle -= Math.PI * 2;

      // Map smoothed angle to nearest frame index (0..63)
      let frameIndex = Math.round((mouseRef.current.currentAngle / (Math.PI * 2)) * TOTAL_FRAMES) % TOTAL_FRAMES;
      if (frameIndex < 0) frameIndex += TOTAL_FRAMES;

      // Clear & fill canvas with seamless background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Choose crisp single frame (Zero ghosting: exactly one frame at 100% opacity)
      let frameToDraw = null;
      if (inDeadzone) {
        frameToDraw = centerFrameRef.current;
      } else {
        frameToDraw = framesRef.current[frameIndex];
      }

      if (frameToDraw && frameToDraw.complete && frameToDraw.naturalWidth > 0) {
        ctx.drawImage(
          frameToDraw,
          Math.round(drawX * dpr),
          Math.round(drawY * dpr),
          Math.round(drawW * dpr),
          Math.round(drawH * dpr)
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchstart', handlePointerMove);
    };
  }, [onFaceCoords]);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} className="character-canvas" />
    </div>
  );
}
